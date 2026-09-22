import { useLayoutEffect, useRef, useState } from "react";
import { Box, Text } from "@mantine/core";

import type { CalledTicket } from "../MonitorPanel";
import type { MonitorTheme } from "../../../types/theme";
import { subtleBorder } from "./shared";


interface Props {
    ticket: CalledTicket;
    theme: MonitorTheme;
    emphasized?: boolean;
    showSeparator?: boolean;
    compact?: boolean;
    uniform?: boolean;
}


const CHAR_FACTOR = 0.62;


export default function TicketTableRow({ ticket, theme, emphasized = false, showSeparator = true, compact = false, uniform = false }: Props) {

    const rowRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });

    // El alto/ancho de la fila lo fija el flex del layout (no el contenido), así que
    // medirlo es estable y no entra en bucle al ajustar la fuente.
    useLayoutEffect(() => {
        const el = rowRef.current;
        if (!el) return;

        const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);


    const compactScale = compact ? 0.79 : 1;

    // En el layout compacto (Image + Table) o uniforme (Table) el histórico comparte
    // el tamaño del turno actual; el resaltado (color/fondo) sigue marcado por `emphasized`.
    const big = compact || uniform || emphasized;

    const maxTicketPx = Math.min(
        window.innerWidth * (big ? 0.18 : 0.10),
        window.innerHeight * (big ? 0.34 : 0.22),
    );

    const ticketChars = Math.max(ticket.ticketCode.length, 1);
    const counterChars = Math.max((ticket.counterCode ?? "").length, 1);

    const counterPx = (big
        ? Math.max(12, Math.min(size.h * 0.38, window.innerWidth * 0.055))
        : Math.max(10, Math.min(size.h * 0.36, window.innerWidth * 0.045))) * compactScale;

    // Si el nombre del puesto no cabe en una línea, se parte en dos.
    const counterBudget = size.w * (compact ? 0.46 : 0.48);
    const counterSingleLine = ticket.counterCode ? counterChars * counterPx * CHAR_FACTOR : 0;
    const wrapCounter = Boolean(ticket.counterCode) && counterSingleLine > counterBudget;
    const counterEst = ticket.counterCode ? Math.min(counterSingleLine, counterBudget) : 0;
    const remaining = Math.max(size.w * 0.94 - counterEst, size.w * 0.35);

    const byHeight = size.h * (big ? 0.70 : 0.68) * compactScale;
    const byWidth = ((remaining * 0.96) / (ticketChars * CHAR_FACTOR)) * compactScale;
    const ticketPx = Math.max(16, Math.min(maxTicketPx, byHeight, byWidth));


    const ticketColor = emphasized ? theme.textColor : theme.historyTextColor;
    const counterColor = emphasized ? theme.secondaryTextColor : theme.historySecondaryTextColor;

    const background = emphasized
        ? `color-mix(in srgb, ${theme.borderColor} 7%, transparent)`
        : "transparent";


    return (
        <Box
            ref={rowRef}
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "clamp(0.5rem, 1.5vw, 2rem)",
                padding: "0 clamp(1rem, 2vw, 3rem)",
                background,
                borderLeft: emphasized ? `clamp(4px, 0.6vw, 10px) solid ${theme.borderColor}` : "none",
                borderBottom: showSeparator ? `1px solid ${subtleBorder(theme)}` : "none",
                minWidth: 0,
                overflow: "hidden",
            }}
        >
            <Text
                fw={900}
                c={ticketColor}
                style={{
                    fontSize: `${ticketPx}px`,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                }}
            >
                {ticket.ticketCode}
            </Text>

            {ticket.counterCode && (
                <Text
                    fw={emphasized ? 800 : 600}
                    c={counterColor}
                    tt="uppercase"
                    style={{
                        fontSize: `${counterPx}px`,
                        lineHeight: wrapCounter ? 1.05 : 1,
                        letterSpacing: "0.06em",
                        whiteSpace: wrapCounter ? "normal" : "nowrap",
                        overflowWrap: wrapCounter ? "break-word" : undefined,
                        textAlign: "right",
                        maxWidth: wrapCounter ? `${counterBudget}px` : undefined,
                        minWidth: 0,
                    }}
                >
                    {ticket.counterCode}
                </Text>
            )}
        </Box>
    );
}