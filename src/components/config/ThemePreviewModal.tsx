import { Badge, Box, Group, Modal } from "@mantine/core";

import TicketMonitorPanel from "../monitors/TicketMonitorPanel";
import SetFreeMonitorPanel from "../monitors/SetFreeMonitorPanel";
import ManualCallMonitorPanel from "../monitors/ManualCallMonitorPanel";

import type { MonitorTheme } from "../../types/theme";
import type { CalledTicket } from "../monitors/MonitorPanel";


interface Props {
    opened: boolean;
    onClose: () => void;
    flowType: number;
    theme: MonitorTheme;
}


const FLOW_LABEL: Record<number, string> = {
    0: "TicketMachine",
    1: "SetFree",
    2: "ManualCall",
};


interface SampleData {
    freeCounter?: string;
    freeHistory?: string[];
    code?: string;
    counterCode?: string;
    currentTicket?: CalledTicket;
    lastTickets?: CalledTicket[];
}


function buildSample(flowType: number): SampleData {
    const now = Date.now();

    if (flowType === 1) {
        return { freeCounter: "3", freeHistory: ["2", "1", "4"] };
    }

    if (flowType === 2) {
        return { code: "78", counterCode: "P-2" };
    }

    const currentTicket: CalledTicket = {
        ticketId: "preview-current",
        ticketCode: "A-042",
        counterCode: "3",
        calledAt: now,
    };
    const lastTickets: CalledTicket[] = [
        { ticketId: "preview-1", ticketCode: "A-041", counterCode: "2", calledAt: now - 60_000 },
        { ticketId: "preview-2", ticketCode: "A-040", counterCode: "1", calledAt: now - 120_000 },
        { ticketId: "preview-3", ticketCode: "A-039", counterCode: "5", calledAt: now - 180_000 },
    ];
    return { currentTicket, lastTickets };
}


export default function ThemePreviewModal({ opened, onClose, flowType, theme }: Props) {

    const sample = buildSample(flowType);


    function renderPanel() {
        switch (flowType) {
            case 1:
                return (
                    <SetFreeMonitorPanel
                        freeCounter={sample.freeCounter ?? null}
                        freeHistory={sample.freeHistory ?? []}
                        theme={theme}
                    />
                );
            case 2:
                return (
                    <ManualCallMonitorPanel
                        code={sample.code ?? null}
                        counterCode={sample.counterCode ?? null}
                        theme={theme}
                    />
                );
            default:
                return (
                    <TicketMonitorPanel
                        currentTicket={sample.currentTicket ?? null}
                        lastTickets={sample.lastTickets ?? []}
                        theme={theme}
                    />
                );
        }
    }


    // El modal es fullScreen, así que el panel se renderiza a tamaño real (1:1
    // con el monitor). Los controles flotan encima sin restar espacio.
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            fullScreen
            withCloseButton={false}
            padding={0}
            transitionProps={{ transition: "fade", duration: 150 }}
            styles={{
                root: { padding: 0 },
                inner: { padding: 0 },
                content: { height: "100%" },
                body: { height: "100%", padding: 0 },
            }}
        >
            <Box style={{ position: "relative", width: "100%", height: "100%" }}>
                {renderPanel()}

                <Group
                    gap="sm"
                    style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        zIndex: 50,
                    }}
                >
                    <Badge variant="filled" color="dark" size="lg" style={{ textTransform: "none" }}>
                        Preview — {FLOW_LABEL[flowType] ?? "Monitor"}
                    </Badge>
                    <Badge variant="light" color="gray" size="lg" style={{ textTransform: "none" }}>
                        Sample data
                    </Badge>
                </Group>

                <Badge
                    component="button"
                    variant="filled"
                    color="blue"
                    size="lg"
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 50,
                        cursor: "pointer",
                        textTransform: "none",
                    }}
                >
                    Close preview
                </Badge>
            </Box>
        </Modal>
    );
}
