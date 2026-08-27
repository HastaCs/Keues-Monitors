import { useLayoutEffect, useRef, useState } from "react";
import { Box, Text } from "@mantine/core";

import type { CalledTicket } from "../MonitorPanel";
import type { MonitorTheme } from "../../../types/theme";
import { historyCardBorder } from "./shared";


interface Props {
    ticket: CalledTicket;
    theme: MonitorTheme;
    opacity?: number;
}


const CHAR_FACTOR = 0.62;


export default function TicketHistoryCard({ ticket, theme, opacity = 1 }: Props) {

    const cardRef = useRef<HTMLDivElement | null>(null);
    const [cardWidth, setCardWidth] = useState(0);

    useLayoutEffect(() => {
        const el = cardRef.current;
        if (!el) return;

        const measure = () => setCardWidth(el.clientWidth);

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const padPx = Math.min(24, Math.max(8, Math.min(window.innerWidth * 0.012, window.innerHeight * 0.016)));
    const gapPx = Math.min(32, Math.max(8, window.innerWidth * 0.015));
    const maxTicketPx = Math.min(window.innerWidth * 0.04, window.innerHeight * 0.06);
    const maxCounterPx = Math.min(window.innerWidth * 0.02, window.innerHeight * 0.03);

    const inner = cardWidth > 0 ? cardWidth - padPx * 2 : 0;

    const counterEst = ticket.counterCode
        ? Math.max(ticket.counterCode.length, 1) * maxCounterPx * CHAR_FACTOR
        : 0;
    const ticketEst = Math.max(ticket.ticketCode.length, 1) * maxTicketPx * CHAR_FACTOR;
    const est = counterEst + (ticket.counterCode ? gapPx : 0) + ticketEst;

    const scale = inner > 0 && est > inner ? Math.min(1, inner / est) : 1;

    const ticketFontSize = `${Math.max(16, maxTicketPx * scale)}px`;
    const counterFontSize = `${Math.max(12, maxCounterPx * scale)}px`;

    return (
        <Box
            ref={cardRef}
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: ticket.counterCode ? "space-between" : "center",
                gap: "clamp(0.5rem, 1.5vw, 2rem)",
                padding: "clamp(0.5rem, min(1.2vw, 1.6vh), 1.5rem)",
                borderRadius: "clamp(0.75rem, 1.5vw, 2rem)",
                background: theme.historyCardBackground,
                border: historyCardBorder(theme),
                opacity,
                minWidth: 0,
                overflow: "hidden",
            }}
        >
            {ticket.counterCode && (
                <Text
                    fw={600}
                    c={theme.historySecondaryTextColor}
                    tt="uppercase"
                    style={{
                        fontSize: counterFontSize,
                        lineHeight: 1,
                        letterSpacing: "0.06em",
                        minWidth: 0,
                        whiteSpace: "nowrap",
                    }}
                >
                    {ticket.counterCode}
                </Text>
            )}
            <Text
                fw={800}
                c={theme.historyTextColor}
                style={{
                    fontSize: ticketFontSize,
                    lineHeight: 1,
                    minWidth: 0,
                    whiteSpace: "nowrap",
                }}
            >
                {ticket.ticketCode}
            </Text>
        </Box>
    );
}