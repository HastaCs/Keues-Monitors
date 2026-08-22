import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Group } from "@mantine/core";
import { IconSettings, IconMaximize } from "@tabler/icons-react";

import TicketMonitorPanel from "./TicketMonitorPanel";
import SetFreeMonitorPanel from "./SetFreeMonitorPanel";
import ManualCallMonitorPanel from "./ManualCallMonitorPanel";

import {
    connect,
    disconnect,
    subscribeStatus,
    onTicketCalled,
    onTicketAttended,
    onCounterFree,
    onManualCall,
} from "../../api/signalRService";

import { getCounters, getTickets } from "../../api/keuesApi";
import { ttsSpeak } from "../../api/ttsService";
import { configureTarget } from "../../api/net";

import { resolveTheme } from "../../types/theme";

import type { ConnectionStatus, TicketCalledEvent, TicketAttendedEvent, CounterFreeEvent, ManualCallEvent } from "../../api/signalRService";
import type { MonitorConfiguration } from "../../types/config";
import type { Counter } from "../../types/models";


interface Props {
    config: MonitorConfiguration;
    onOpenConfig: () => void;
}


export interface CalledTicket {
    ticketId: string;
    ticketCode: string;
    counterCode?: string;
    calledAt: number;
}


export default function MonitorPanel({ config, onOpenConfig }: Props) {

    const flowType = config.flowType ?? 0;
    const theme = resolveTheme(flowType, config.theme?.[flowType]);

    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Mapa counterCode -> counter, usado para resolver el nombre de la caja en anuncios de voz
    const countersByCodeRef = useRef<Map<string, Counter>>(new Map());

    // Estado para TicketMachine (flowType 0)
    const [currentTicket, setCurrentTicket] = useState<CalledTicket | null>(null);
    const [lastTickets, setLastTickets] = useState<CalledTicket[]>([]);

    // Estado para SetFree (flowType 1)
    const [freeState, setFreeState] = useState<{ current: string | null; queue: string[]; seq: number }>(
        { current: null, queue: [], seq: 0 }
    );
    const [freeHistory, setFreeHistory] = useState<string[]>([]);

    // Estado para ManualCall (flowType 2)
    const [manualCode, setManualCode] = useState<string | null>(null);
    const [manualCounterCode, setManualCounterCode] = useState<string | null>(null);


    const DISPLAY_MS = 5000;


    function addFreeEvent(code: string) {
        setFreeHistory(prev => [code, ...prev.filter(x => x !== code)].slice(0, 10));
        setFreeState(prev => {
            if (prev.current === null) {
                return { current: code, queue: prev.queue, seq: prev.seq + 1 };
            }
            if (prev.current === code) {
                return prev;
            }
            return { current: prev.current, queue: [...prev.queue, code], seq: prev.seq };
        });
    }


    // Auto-ocultar el puesto a los DISPLAY_MS. Keyed por current+seq: aunque el
    // siguiente de la cola tenga el mismo código, seq cambia y el timer se reinicia.
    const freeCurrent = freeState.current;
    const freeSeq = freeState.seq;

    useEffect(() => {
        if (freeCurrent === null) return;

        const timer = setTimeout(() => {
            setFreeState(prev => prev.queue.length > 0
                ? { current: prev.queue[0], queue: prev.queue.slice(1), seq: prev.seq + 1 }
                : { current: null, queue: [], seq: prev.seq });
        }, DISPLAY_MS);
        return () => clearTimeout(timer);
    }, [freeCurrent, freeSeq]);


    // Anunciar por voz solo cuando la caja aparece en pantalla (no al recibir el evento,
    // que puede quedar en cola hasta DISPLAY_MS).
    const announceFree = useCallback((code: string) => {
        const theme = resolveTheme(flowType, config.theme?.[flowType]);
        if (!theme.voiceEnabled) return;

        const counter = countersByCodeRef.current.get(code);
        const target = counter?.code || code;
        const prefix = theme.voicePrefix?.trim();

        void ttsSpeak(prefix ? `${prefix} ${target}` : target, theme.voiceId);
    }, [config, flowType]);

    useEffect(() => {
        if (freeCurrent === null) return;
        announceFree(freeCurrent);
    }, [freeCurrent, freeSeq, announceFree]);


    useEffect(() => {
        if (!config.server || !config.locationId) return;

        const unsubStatus = subscribeStatus(setStatus);

        const unsubTicket = onTicketCalled((e: TicketCalledEvent) => {
            if (flowType === 2) {
                setManualCode(e.ticketCode);
                setManualCounterCode(e.counterCode ?? null);
                return;
            }

            if (flowType === 1) {
                addFreeEvent(e.counterCode ?? e.ticketCode);
                return;
            }

            const entry: CalledTicket = {
                ticketId: e.ticketId ?? "",
                ticketCode: e.ticketCode,
                counterCode: e.counterCode,
                calledAt: Date.now(),
            };
            setCurrentTicket(entry);
            setLastTickets(prev => [entry, ...prev].slice(0, 10));
        });

        const unsubAttended = onTicketAttended((e: TicketAttendedEvent) => {
            setCurrentTicket(prev => prev && prev.ticketId === e.ticketId ? null : prev);
            setLastTickets(prev => prev.filter(t => t.ticketId !== e.ticketId));
        });

        const unsubFree = onCounterFree((e: CounterFreeEvent) => {
            addFreeEvent(e.counterCode);
        });

        const unsubManual = onManualCall((e: ManualCallEvent) => {
            setManualCode(e.code);
        });

        const configured = configureTarget(config.server).catch(() => {});

        void (async () => {
            await configured;
            await connect(config).catch(() => {});
        })();

        // Recuperación inicial: cargar counters (para resolver nombres de caja en anuncios)
        // y, en flujos TicketMachine, los tickets en curso (status 1).
        const server = config.server;
        const locationId = config.locationId;
        let cancelled = false;
        async function loadInitialData() {
            try {
                await configured;
                if (cancelled) return;

                const counters = await getCounters(server, locationId);
                if (cancelled) return;

                countersByCodeRef.current = new Map(counters.map(c => [c.code, c]));

                if (flowType !== 0) return;

                const tickets = await getTickets(server, locationId);
                if (cancelled) return;

                const counterCodeById = new Map(counters.map(c => [c.id, c.code]));

                const active = tickets
                    .filter(t => t.status === 1)
                    .map(t => ({
                        ticketId: t.id,
                        ticketCode: t.code,
                        counterCode: t.counter ? counterCodeById.get(t.counter.id) : undefined,
                        calledAt: t.calledAt ? Date.parse(t.calledAt) : Date.now(),
                    }))
                    .sort((a, b) => b.calledAt - a.calledAt)
                    .slice(0, 10);

                setCurrentTicket(active[0] ?? null);
                setLastTickets(active.slice(1));
            }
            catch {
                // Sin acceso a la API: el monitor queda a la espera de eventos realtime
            }
        }

        void loadInitialData();

        return () => {
            cancelled = true;
            unsubStatus();
            unsubTicket();
            unsubAttended();
            unsubFree();
            unsubManual();
            void disconnect();
        };
    }, [config, flowType]);


    useEffect(() => {
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);


    function toggleFullscreen() {
        if (document.fullscreenElement) {
            void document.exitFullscreen();
        } else {
            void document.documentElement.requestFullscreen();
        }
    }


    function renderPanel() {
        switch (flowType) {
            case 1:
                return <SetFreeMonitorPanel freeCounter={freeState.current} freeHistory={freeHistory} theme={theme} />;
            case 2:
                return <ManualCallMonitorPanel code={manualCode} counterCode={manualCounterCode} theme={theme} />;
            default:
                return <TicketMonitorPanel currentTicket={currentTicket} lastTickets={lastTickets} theme={theme} />;
        }
    }


    const statusColor: Record<ConnectionStatus, string> = {
        connecting: "yellow",
        connected: "green",
        reconnecting: "orange",
        disconnected: "red",
    };

    const statusLabel: Record<ConnectionStatus, string> = {
        connecting: "Connecting…",
        connected: "Connected",
        reconnecting: "Reconnecting…",
        disconnected: "No connection",
    };


    return (
        <>
            {/* Barra superior central: oculta en fullscreen (Esc para salir) */}
            {!isFullscreen && (
                <Group pos="fixed" top={16} left={12} gap="xs" style={{ zIndex: 100 }}>
                    <Button
                        leftSection={<IconMaximize size={14} />}
                        variant="filled"
                        size="xs"
                        color="dark"
                        onClick={toggleFullscreen}
                    >
                        Fullscreen
                    </Button>

                    <Button
                        leftSection={<IconSettings size={14} />}
                        variant="filled"
                        size="xs"
                        color="dark"
                        onClick={onOpenConfig}
                    >
                        Settings
                    </Button>
                </Group>
            )}

            {/* Panel principal */}
            {renderPanel()}

            {/* Estado de conexión abajo-izquierda, como Keues-Counter (oculto en fullscreen) */}
            {!isFullscreen && (
                <Group pos="fixed" bottom={12} left={12} gap="xs" style={{ zIndex: 100 }}>
                    <Badge size="md" variant="light" color={statusColor[status]}>
                        {statusLabel[status]}
                    </Badge>
                </Group>
            )}
        </>
    );
}
