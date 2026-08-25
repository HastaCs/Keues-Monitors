import type { CSSProperties } from "react";

import type { CalledTicket } from "../MonitorPanel";
import type { MonitorTheme } from "../../../types/theme";


export function subtleBorder(theme: MonitorTheme): string {
    const base = theme.historyBorderColor ?? theme.secondaryTextColor;
    return `color-mix(in srgb, ${base} 20%, transparent)`;
}


export function historyCardBorder(theme: MonitorTheme): string {
    const width = theme.historyBorderWidth ?? 1;
    const base = theme.historyBorderColor ?? theme.secondaryTextColor;
    return `${width}px solid color-mix(in srgb, ${base} 20%, transparent)`;
}


export function mutedText(theme: MonitorTheme): string {
    return `color-mix(in srgb, ${theme.secondaryTextColor} 50%, transparent)`;
}


export function panelBackgroundStyle(theme: MonitorTheme): CSSProperties {
    return {
        backgroundColor: theme.background,
        backgroundImage: theme.backgroundImage ? `url("${theme.backgroundImage}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
    };
}


export function buildHistory(currentTicket: CalledTicket | null, lastTickets: CalledTicket[]): CalledTicket[] {
    return (currentTicket
        ? lastTickets.filter(t => t.calledAt !== currentTicket.calledAt)
        : lastTickets)
        .reduce<CalledTicket[]>((acc, t) => {
            if (!acc.some(x => x.ticketCode === t.ticketCode))
                acc.push(t);
            return acc;
        }, [])
        .slice(0, 10);
}
