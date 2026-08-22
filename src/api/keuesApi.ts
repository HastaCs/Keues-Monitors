import { serverBase } from "./net";

import type { Location, Counter, Flow, FlowNode, Ticket } from "../types/models";


export async function getLocations(server: string): Promise<Location[]> {

    const response = await fetch(`${serverBase(server)}/api/locations`);
    const json = await response.json();

    return json.data;
}


export async function getFlows(
    server: string,
    locationId: string
): Promise<Flow[]> {

    const response = await fetch(`${serverBase(server)}/api/flows?locationId=${locationId}`);
    const json = await response.json();

    return json.data;
}


export async function getFlow(
    server: string,
    flowId: string
): Promise<Flow> {

    const response = await fetch(`${serverBase(server)}/api/flows/${flowId}`);

    return await response.json();
}


export async function getCounters(
    server: string,
    locationId: string
): Promise<Counter[]> {

    const response = await fetch(`${serverBase(server)}/api/counters?locationId=${locationId}`);
    const json = await response.json();

    return json.data;
}


export async function getTickets(
    server: string,
    locationId: string
): Promise<Ticket[]> {

    const response = await fetch(`${serverBase(server)}/api/tickets?locationId=${locationId}`);
    const json = await response.json();

    return json.data;
}


export function getFlowQueueIds(flow: Flow): string[] {

    try {
        const nodes = JSON.parse(flow.flowJson) as FlowNode[];

        return nodes
            .filter(x => x.nodeType === "ticket" && x.queueId)
            .map(x => x.queueId as string);
    }
    catch {
        return [];
    }
}
