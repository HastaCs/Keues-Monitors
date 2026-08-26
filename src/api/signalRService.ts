import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";

import type { IRetryPolicy } from "@microsoft/signalr";
import { serverBase } from "./net";
import type { MonitorConfiguration } from "../types/config";


export type ConnectionStatus =
    | "connecting"
    | "connected"
    | "reconnecting"
    | "disconnected";


// Política de reconexión infinita: reintenta cada 5s sin límite.
const infiniteReconnectPolicy: IRetryPolicy = {
    nextRetryDelayInMilliseconds: () => 5000,
};


// Evento: turno llamado. Es el evento único que emite el backend para todos los flujos:
// TicketMachine (flowType 0), SetFree (flowType 1) y ManualCall (flowType 2).
// Payload confirmado: { ticketId, ticketCode, counterCode }
export interface TicketCalledEvent {
    ticketId?: string;
    ticketCode: string;
    counterCode?: string;
}

// Evento: turno atendido. Indica que un ticket ya fue atendido y debe desaparecer del monitor.
// Payload: { ticketId }
export interface TicketAttendedEvent {
    ticketId: string;
}

// Evento: turno cancelado. El backend lo envía como string (el ticketId) o como
// objeto { ticketId }. Indica que un ticket fue cancelado y debe desaparecer del monitor.
export type TicketCancelledEvent = string | { ticketId: string };

// Evento: puesto libre (flowType 1 — SetFree)
// Payload confirmado: { counterId, counterCode }
export interface CounterFreeEvent {
    counterId: string;
    counterCode: string;
}

// Evento: llamada manual (flowType 2 — ManualCall)
export interface ManualCallEvent {
    code: string;
    id?: string;
    queueId?: string;
}


type StatusListener = (status: ConnectionStatus) => void;
type TicketCalledListener = (event: TicketCalledEvent) => void;
type TicketAttendedListener = (event: TicketAttendedEvent) => void;
type TicketCancelledListener = (event: TicketCancelledEvent) => void;
type CounterFreeListener = (event: CounterFreeEvent) => void;
type ManualCallListener = (event: ManualCallEvent) => void;


let connection: HubConnection | null = null;
let statusListener: StatusListener | null = null;
let ticketCalledListener: TicketCalledListener | null = null;
let ticketAttendedListener: TicketAttendedListener | null = null;
let ticketCancelledListener: TicketCancelledListener | null = null;
let counterFreeListener: CounterFreeListener | null = null;
let manualCallListener: ManualCallListener | null = null;
let connectSeq = 0;
let lastUrl = "";


function notify(status: ConnectionStatus) {
    statusListener?.(status);
}


export function subscribeStatus(listener: StatusListener): () => void {
    statusListener = listener;
    return () => {
        if (statusListener === listener)
            statusListener = null;
    };
}


export function onTicketCalled(listener: TicketCalledListener): () => void {
    ticketCalledListener = listener;
    return () => {
        if (ticketCalledListener === listener)
            ticketCalledListener = null;
    };
}


export function onTicketAttended(listener: TicketAttendedListener): () => void {
    ticketAttendedListener = listener;
    return () => {
        if (ticketAttendedListener === listener)
            ticketAttendedListener = null;
    };
}


export function onTicketCancelled(listener: TicketCancelledListener): () => void {
    ticketCancelledListener = listener;
    return () => {
        if (ticketCancelledListener === listener)
            ticketCancelledListener = null;
    };
}


export function onCounterFree(listener: CounterFreeListener): () => void {
    counterFreeListener = listener;
    return () => {
        if (counterFreeListener === listener)
            counterFreeListener = null;
    };
}


export function onManualCall(listener: ManualCallListener): () => void {
    manualCallListener = listener;
    return () => {
        if (manualCallListener === listener)
            manualCallListener = null;
    };
}


function buildUrl(config: MonitorConfiguration): string {

    const params = new URLSearchParams({
        deviceId: config.deviceId ?? "",
        name: config.deviceName ?? "",
        locationId: config.locationId ?? "",
        flowId: config.flowId ?? "",
        type: "Monitor"
    });

    return `${serverBase(config.server)}/devices?${params.toString()}`;
}


async function stopCurrent(): Promise<void> {

    const old = connection;
    connection = null;
    lastUrl = "";

    if (old && old.state !== HubConnectionState.Disconnected) {
        try {
            await old.stop();
        }
        catch {
            // La conexión ya estaba parada o se cerró
        }
    }
}


export async function connect(config: MonitorConfiguration): Promise<void> {

    const url = buildUrl(config);
    const seq = ++connectSeq;

    if (connection && lastUrl === url && connection.state === HubConnectionState.Connected) {
        notify("connected");
        return;
    }

    await stopCurrent();

    if (seq !== connectSeq)
        return;

    lastUrl = url;
    connection = new HubConnectionBuilder()
        .withUrl(url)
        .withAutomaticReconnect(infiniteReconnectPolicy)
        .build();

    connection.on("TicketCalled", (event: TicketCalledEvent) => {
        ticketCalledListener?.(event);
    });

    connection.on("TicketAttended", (event: TicketAttendedEvent) => {
        ticketAttendedListener?.(event);
    });

    connection.on("TicketCancelled", (event: TicketCancelledEvent) => {
    
        ticketCancelledListener?.(event);
    });

    // TODO: confirmar nombre exacto del evento con el backend cuando lo implemente
    connection.on("CounterFree", (event: CounterFreeEvent) => {
        counterFreeListener?.(event);
    });

    // TODO: confirmar nombre exacto del evento con el backend cuando lo implemente
    connection.on("ManualCall", (event: ManualCallEvent) => {
        manualCallListener?.(event);
    });

    connection.onreconnecting(() => {
        if (seq === connectSeq)
            notify("reconnecting");
    });
    connection.onreconnected(() => {
        if (seq === connectSeq)
            notify("connected");
    });
    connection.onclose(() => {
        if (seq === connectSeq)
            notify("disconnected");
    });

    notify("connecting");

    try {
        await connection.start();

        if (seq !== connectSeq) {
            void connection.stop();
            return;
        }

        notify("connected");
    }
    catch {
        if (seq === connectSeq)
            notify("disconnected");
    }
}


export async function disconnect(): Promise<void> {

    connectSeq++;

    const had = connection !== null;

    await stopCurrent();

    if (had)
        notify("disconnected");
}
