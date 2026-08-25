import { useEffect, useRef, useState } from "react";
import { Box, Text } from "@mantine/core";

import type { CalledTicket } from "../MonitorPanel";
import type { MonitorTheme } from "../../../types/theme";
import { mutedText } from "./shared";


interface Props {
    ticket: CalledTicket | null;
    theme: MonitorTheme;
}


export default function TicketCallout({ ticket, theme }: Props) {

    const [animate, setAnimate] = useState(false);
    const [glow, setGlow] = useState(false);
    const [area, setArea] = useState({ w: 0, h: 0 });
    const prevTicket = useRef<string | null>(null);
    const areaRef = useRef<HTMLDivElement | null>(null);


    // Mide el área disponible para que la card nunca desborde el contenedor.
    useEffect(() => {
        const el = areaRef.current;
        if (!el) return;

        const measure = () => setArea({ w: el.clientWidth, h: el.clientHeight });
        measure();

        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);


    useEffect(() => {
        if (!ticket) {
            prevTicket.current = null;
            return;
        }
        if (ticket.ticketCode === prevTicket.current) return;

        prevTicket.current = ticket.ticketCode;

        setAnimate(false);
        setGlow(false);

        requestAnimationFrame(() => {
            setAnimate(true);
            setGlow(true);
        });

        const timer = setTimeout(() => setGlow(false), 2500);
        return () => clearTimeout(timer);
    }, [ticket]);


    const glowShadow = glow && theme.borderWidth > 0
        ? `0 0 0 ${theme.borderWidth}px ${theme.borderColor}, 0 8px 64px color-mix(in srgb, ${theme.borderColor} 18%, transparent), 0 0 100px color-mix(in srgb, ${theme.borderColor} 8%, transparent)`
        : "0 4px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)";


    const code = ticket?.ticketCode ?? "—";
    const hasCounter = Boolean(ticket?.counterCode);


    function mainFontSize(): number {
        const chars = Math.max(code.length, 1);

        const byViewport = Math.min(window.innerWidth * 0.22, window.innerHeight * 0.34);

        let byArea = Number.POSITIVE_INFINITY;
        if (area.w > 0 && area.h > 0) {
            const counterShare = hasCounter ? 0.30 : 0;
            const budgetH = Math.max(0, area.h * 0.86 - (hasCounter ? area.h * 0.02 : 0));
            const byHeight = budgetH / (1 + counterShare);
            const byWidth = (area.w * 0.86) / (chars * 0.62);
            byArea = Math.min(byHeight, byWidth);
        }

        return Math.max(24, Math.min(byViewport, byArea));
    }

    const numPx = mainFontSize();
    const counterPx = Math.max(14, numPx * 0.30);


    return (
        <Box
            ref={areaRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            {ticket ? (
                <Box
                    style={{
                        textAlign: "center",
                        animation: animate ? "ticketEntrance 0.35s ease-out forwards" : undefined,
                    }}
                >
                    <Box
                        style={{
                            padding: "clamp(1.25rem, 3vw, 4rem)",
                            borderRadius: "clamp(1rem, 2vw, 2.5rem)",
                            background: theme.cardBackground,
                            boxShadow: glowShadow,
                            border: `${theme.borderWidth}px solid ${theme.borderColor}`,
                            transition: "box-shadow 0.4s ease",
                            minWidth: "clamp(18rem, 40vw, 60rem)",
                            maxWidth: "100%",
                        }}
                    >
                        {ticket.counterCode && (
                            <Text
                                fw={800}
                                c={theme.secondaryTextColor}
                                tt="uppercase"
                                style={{
                                    fontSize: `${counterPx}px`,
                                    lineHeight: 1,
                                    letterSpacing: "0.08em",
                                }}
                            >
                                {ticket.counterCode}
                            </Text>
                        )}

                        <Text
                            fw={900}
                            c={theme.textColor}
                            mt={ticket.counterCode ? 8 : 0}
                            style={{
                                fontSize: `${numPx}px`,
                                lineHeight: 1,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {ticket.ticketCode}
                        </Text>
                    </Box>
                </Box>
            ) : (
                <Box style={{ textAlign: "center" }}>
                    <Text
                        fw={300}
                        c={mutedText(theme)}
                        style={{
                            fontSize: `${Math.max(48, area.h > 0 ? area.h * 0.30 : window.innerWidth * 0.12)}px`,
                            lineHeight: 1,
                        }}
                    >
                        —
                    </Text>
                    <Text
                        c={theme.secondaryTextColor}
                        mt={8}
                        style={{ fontSize: "clamp(1rem, 2vw, 3rem)" }}
                    >
                        Waiting for tickets…
                    </Text>
                </Box>
            )}

            <style>{`
                @keyframes ticketEntrance {
                    from { opacity: 0; transform: scale(0.82); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </Box>
    );
}
