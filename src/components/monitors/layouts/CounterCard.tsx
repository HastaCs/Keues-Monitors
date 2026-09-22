import { useLayoutEffect, useRef, useState } from "react";
import { Box, Text } from "@mantine/core";

import type { MonitorTheme } from "../../../types/theme";
import type { Counter } from "../../../types/models";
import { historyCardBorder, mutedText } from "./shared";


interface Props {
    counter: Counter;
    ticketCode?: string;
    isActive: boolean;
    theme: MonitorTheme;
}


const CHAR_FACTOR = 0.62;


export default function CounterCard({ counter, ticketCode, isActive, theme }: Props) {

    const cardRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });

    // El tamaño de la casilla lo fija el grid/flex (no el contenido): medirlo es estable.
    useLayoutEffect(() => {
        const el = cardRef.current;
        if (!el) return;

        const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);


    const code = ticketCode ?? "";
    const chars = Math.max(code.length, 1);

    const maxPx = Math.min(window.innerWidth * 0.10, window.innerHeight * 0.22);

    // Nombre del puesto: si no cabe en una línea, se parte en dos respetando palabras.
    const labelPxBase = Math.max(16, Math.min(size.h * 0.24, window.innerWidth * 0.045));
    const wrapLabel = counter.code.length * labelPxBase * CHAR_FACTOR > size.w * 0.92;
    const labelPx = wrapLabel
        ? Math.max(12, Math.min(size.h * 0.16, window.innerWidth * 0.032))
        : labelPxBase;

    const byHeight = size.h * (wrapLabel ? 0.36 : isActive ? 0.50 : 0.46);
    const byWidth = (size.w * 0.88) / (chars * CHAR_FACTOR);
    const ticketPx = code ? Math.max(18, Math.min(maxPx, byHeight, byWidth)) : 0;


    return (
        <Box
            ref={cardRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(0.25rem, 0.6vw, 0.75rem)",
                padding: "clamp(0.5rem, min(1.2vw, 1.6vh), 1.5rem)",
                borderRadius: "clamp(0.75rem, 1.5vw, 2rem)",
                background: isActive
                    ? `color-mix(in srgb, ${theme.borderColor} 10%, ${theme.cardBackground})`
                    : theme.cardBackground,
                border: isActive
                    ? `${Math.max(theme.borderWidth, 3)}px solid ${theme.borderColor}`
                    : historyCardBorder(theme),
                boxShadow: isActive ? "0 8px 40px color-mix(in srgb, #000 12%, transparent)" : undefined,
                minWidth: 0,
                overflow: "hidden",
            }}
        >
            <Text
                fw={isActive ? 800 : 700}
                tt="uppercase"
                c={isActive ? theme.secondaryTextColor : theme.historySecondaryTextColor}
                style={{
                    fontSize: `${labelPx}px`,
                    lineHeight: wrapLabel ? 1.05 : 1,
                    letterSpacing: "0.08em",
                    whiteSpace: wrapLabel ? "normal" : "nowrap",
                    overflowWrap: wrapLabel ? "break-word" : undefined,
                    textAlign: "center",
                    maxWidth: wrapLabel ? "92%" : undefined,
                    minWidth: 0,
                }}
            >
                {counter.code}
            </Text>

            {code ? (
                <Text
                    fw={900}
                    c={isActive ? theme.textColor : theme.historyTextColor}
                    style={{
                        fontSize: `${ticketPx}px`,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                    }}
                >
                    {code}
                </Text>
            ) : (
                <Text
                    fw={300}
                    c={mutedText(theme)}
                    style={{
                        fontSize: `${Math.max(16, size.h * 0.22)}px`,
                        lineHeight: 1,
                    }}
                >
                    —
                </Text>
            )}
        </Box>
    );
}