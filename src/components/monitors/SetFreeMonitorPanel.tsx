import { useEffect, useRef, useState } from "react";
import { Box, ScrollArea, Text } from "@mantine/core";

import type { MonitorTheme } from "../../types/theme";
import { historyCardBorder } from "./layouts/shared";


interface Props {
    freeCounter: string | null;
    freeHistory: string[];
    theme: MonitorTheme;
}


export default function SetFreeMonitorPanel({ freeCounter, freeHistory, theme }: Props) {

    const [animate, setAnimate] = useState(false);
    const [areaWidth, setAreaWidth] = useState(0);
    const prevCounter = useRef<string | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const areaRef = useRef<HTMLDivElement | null>(null);


    useEffect(() => {
        const el = areaRef.current;
        if (!el) return;

        const measure = () => setAreaWidth(el.clientWidth);

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);


    useEffect(() => {
        if (!freeCounter) return;
        if (freeCounter === prevCounter.current) return;

        prevCounter.current = freeCounter;

        setAnimate(false);
        requestAnimationFrame(() => setAnimate(true));
    }, [freeCounter]);


    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, [freeHistory]);


    // El número crece con el tamaño del monitor (TVs) pero se ajusta a la
    // longitud del código y al ancho disponible para caber en una sola línea
    // dentro de su card.
    function mainFontSize(code: string): string {
        const chars = Math.max(code.length, 1);
        const byViewport = Math.min(window.innerWidth * 0.22, window.innerHeight * 0.32);
        const byChars = (areaWidth * 0.85) / (chars * 0.62);
        const px = Math.max(24, Math.min(byViewport, byChars));
        return `${px}px`;
    }

    function historyFontSize(code: string): string {
        const chars = Math.max(code.length, 1);
        const byViewport = Math.min(window.innerWidth * 0.06, window.innerHeight * 0.09);
        const byChars = (window.innerWidth * 0.26) / (chars * 0.62);
        const px = Math.max(20, Math.min(byViewport, byChars));
        return `clamp(1.4rem, ${px}px, 7rem)`;
    }


    const subtleBorder = `color-mix(in srgb, ${theme.historyBorderColor ?? theme.secondaryTextColor} 20%, transparent)`;
    const historyCardBackground = theme.historyCardBackground;


    return (
        <Box
            h="100vh"
            style={{
                backgroundColor: theme.background,
                backgroundImage: theme.backgroundImage ? `url("${theme.backgroundImage}")` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "row",
                overflow: "hidden",
            }}
        >
            <Box ref={areaRef} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1rem, 3vw, 3rem)" }}>
                {freeCounter ? (
                    <Box
                        style={{
                            textAlign: "center",
                            animation: animate ? "freeEntrance 0.4s ease-out forwards" : undefined,
                        }}
                    >
                        <Box
                            style={{
                                padding: "clamp(1.5rem, 3.5vw, 4.5rem)",
                                borderRadius: "clamp(1rem, 2vw, 2.5rem)",
                                background: theme.cardBackground,
                                boxShadow: "0 8px 64px rgba(20,120,50,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                                border: `${theme.borderWidth}px solid ${theme.borderColor}`,
                                display: "inline-block",
                                minWidth: "clamp(22rem, 50vw, 64rem)",
                            }}
                        >
                            {theme.labelTitle && (
                                <Text
                                    fw={600}
                                    tt="uppercase"
                                    c={theme.labelTitleColor}
                                    mb={8}
                                    style={{
                                        fontSize: theme.labelTitleSize ? `${theme.labelTitleSize}px` : "clamp(1.2rem, 2.2vw, 3rem)",
                                        letterSpacing: "0.18em",
                                    }}
                                >
                                    {theme.labelTitle}
                                </Text>
                            )}

                            <Text
                                fw={900}
                                c={theme.textColor}
                                style={{ fontSize: mainFontSize(freeCounter), lineHeight: 1, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}
                            >
                                {freeCounter}
                            </Text>

                            {theme.labelFooter && (
                                <Text
                                    c={theme.secondaryTextColor}
                                    fw={500}
                                    mt={16}
                                    style={{ fontSize: "clamp(1rem, 2vw, 2.5rem)" }}
                                >
                                    {theme.labelFooter}
                                </Text>
                            )}
                        </Box>
                    </Box>
                ) : (
                   ""
                )}
            </Box>

            {/* Panel derecho: puestos libres recientes */}
            {theme.showHistory && (
                <Box
                    style={{
                        width: "clamp(300px, 30vw, 40rem)",
                        flexShrink: 0,
                        background: theme.historyPanelBackground,
                        borderLeft: `2px solid ${subtleBorder}`,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Text
                        fw={600}
                        tt="uppercase"
                        c={theme.historyHeaderColor}
                        pt="clamp(1rem, 2vw, 3rem)"
                        pb="clamp(0.75rem, 1.5vw, 2rem)"
                        px="clamp(1rem, 2vw, 3rem)"
                        style={{ fontSize: "clamp(1rem, 1.8vw, 2.8rem)", letterSpacing: "0.15em", borderBottom: `2px solid ${subtleBorder}` }}
                    >
                        {theme.historyHeader}
                    </Text>

                    {freeHistory.length > 0 ? (
                        <ScrollArea flex={1} p="clamp(1rem, 2vw, 3rem)" type="never" viewportRef={scrollRef}>
                            <Box style={{ display: "flex", flexDirection: "column", gap: "clamp(0.75rem, 1.5vw, 2rem)" }}>
                                {freeHistory.map(code => (
                                    <Box
                                        key={code}
                                        style={{
                                            padding: "clamp(0.75rem, 1.5vw, 2rem)",
                                            borderRadius: "clamp(0.75rem, 1.2vw, 1.75rem)",
                                            background: historyCardBackground,
                                            border: historyCardBorder(theme),
                                            textAlign: "center",
                                        }}
                                    >
                                        <Text
                                            fw={900}
                                            c={theme.historyTextColor}
                                            style={{ fontSize: historyFontSize(code), lineHeight: 1, overflowWrap: "anywhere" }}
                                        >
                                            {code}
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                        </ScrollArea>
                    ) : (
                        ""
                    )}
                </Box>
            )}

            <style>{`
                @keyframes freeEntrance {
                    from { opacity: 0; transform: translateY(24px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </Box>
    );
}
