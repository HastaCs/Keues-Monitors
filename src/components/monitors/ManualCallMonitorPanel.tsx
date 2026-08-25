import { useEffect, useRef, useState } from "react";
import { Box, ScrollArea, Text } from "@mantine/core";

import type { MonitorTheme } from "../../types/theme";
import { historyCardBorder } from "./layouts/shared";


interface Props {
    code: string | null;
    counterCode: string | null;
    theme: MonitorTheme;
}


interface HistoryEntry {
    counterCode: string;
    code: string;
}


export default function ManualCallMonitorPanel({ code, counterCode, theme }: Props) {

    const [animate, setAnimate] = useState(false);
    const [glow, setGlow] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [area, setArea] = useState({ w: 0, h: 0 });
    const prevRef = useRef<{ code: string; counterCode: string | null } | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const areaRef = useRef<HTMLDivElement | null>(null);


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
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, [history]);


    useEffect(() => {
        if (code === null) {
            prevRef.current = null;
            return;
        }

        const prev = prevRef.current;

        if (prev && prev.code === code && prev.counterCode === counterCode)
            return;

        prevRef.current = { code, counterCode };

        setHistory(prevHistory => {
            let next = prevHistory.filter(x => x.counterCode !== counterCode);

            if (prev && prev.counterCode !== counterCode) {
                next = [
                    ...next.filter(x => x.counterCode !== prev.counterCode),
                    { counterCode: prev.counterCode as string, code: prev.code },
                ];
            }

            return next;
        });

        setAnimate(false);
        setGlow(false);

        requestAnimationFrame(() => {
            setAnimate(true);
            setGlow(true);
        });

        const timer = setTimeout(() => setGlow(false), 2500);
        return () => clearTimeout(timer);
    }, [code, counterCode]);


    const glowShadow = glow && theme.borderWidth > 0
        ? `0 0 0 ${theme.borderWidth}px ${theme.borderColor}, 0 8px 64px color-mix(in srgb, ${theme.borderColor} 18%, transparent), 0 0 100px color-mix(in srgb, ${theme.borderColor} 8%, transparent)`
        : "0 4px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)";

    const subtleBorder = `color-mix(in srgb, ${theme.historyBorderColor ?? theme.secondaryTextColor} 20%, transparent)`;
    const historyCardBackground = theme.historyCardBackground;
    const mutedText = `color-mix(in srgb, ${theme.secondaryTextColor} 50%, transparent)`;


    // El número (counterCode-code) crece con el tamaño del monitor (TVs) pero
    // se ajusta a la longitud del código y al área disponible para caber
    // dentro de su card sin desbordar.
    function mainFontSize(): number {
        const chars = Math.max((counterCode?.length ?? 0) + (code?.length ?? 0), 1);
        const hasCounter = Boolean(counterCode);

        const byViewport = Math.min(window.innerWidth * 0.22, window.innerHeight * 0.32);

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

    function historyFontSize(historyCode: string): string {
        const chars = Math.max(historyCode.length, 1);
        const byViewport = Math.min(window.innerWidth * 0.06, window.innerHeight * 0.09);
        const byChars = (window.innerWidth * 0.26) / (chars * 0.62);
        const px = Math.max(20, Math.min(byViewport, byChars));
        return `clamp(1.4rem, ${px}px, 7rem)`;
    }

    const numPx = mainFontSize();
    const counterPx = Math.max(14, numPx * 0.30);


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
            <Box ref={areaRef} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {code !== null ? (
                    <Box
                        style={{
                            textAlign: "center",
                            animation: animate ? "manualEntrance 0.35s ease-out forwards" : undefined,
                        }}
                    >
                        <Box
                            style={{
                                padding: "clamp(1.25rem, 3vw, 4rem)",
                                borderRadius: "clamp(1rem, 2vw, 2.5rem)",
                                background: theme.cardBackground,
                                boxShadow: glowShadow,
                                border: `${theme.borderWidth}px solid ${theme.borderColor}`,
                                display: "inline-block",
                                minWidth: "clamp(18rem, 40vw, 55rem)",
                                transition: "box-shadow 0.4s ease",
                            }}
                        >
                            {counterCode && (
                                <Text
                                    fw={600}
                                    tt="uppercase"
                                    c={theme.secondaryTextColor}
                                    mb={8}
                                    style={{ fontSize: `${counterPx}px`, letterSpacing: "0.15em" }}
                                >
                                    {counterCode}
                                </Text>
                            )}

                            <Text
                                fw={900}
                                c={theme.textColor}
                                style={{ fontSize: `${numPx}px`, lineHeight: 1, letterSpacing: "-0.02em" }}
                            >
                                {code}
                            </Text>
                        </Box>
                    </Box>
                ) : (
                    <Box style={{ textAlign: "center" }}>
                        <Text
                            fw={300}
                            c={mutedText}
                            style={{ fontSize: "clamp(3rem, 12vw, 20rem)", lineHeight: 1 }}
                        >
                            —
                        </Text>
                        <Text
                            c={theme.secondaryTextColor}
                            mt={8}
                            style={{ fontSize: "clamp(1rem, 2vw, 3rem)" }}
                        >
                            Waiting for calls…
                        </Text>
                    </Box>
                )}
            </Box>

            {/* Panel derecho: últimas llamadas de otras colas */}
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

                {history.length > 0 ? (
                    <ScrollArea flex={1} p="clamp(1rem, 2vw, 3rem)" type="never" viewportRef={scrollRef}>
                        <Box style={{ display: "flex", flexDirection: "column", gap: "clamp(0.75rem, 1.5vw, 2rem)" }}>
                            {history.map(t => (
                                <Box
                                    key={t.counterCode}
                                    style={{
                                        padding: "clamp(0.75rem, 1.5vw, 2rem)",
                                        borderRadius: "clamp(0.75rem, 1.2vw, 1.75rem)",
                                        background: historyCardBackground,
                                        border: historyCardBorder(theme),
                                        textAlign: "center",
                                    }}
                                >
                                    <Text
                                        fw={600}
                                        tt="uppercase"
                                        c={theme.historySecondaryTextColor}
                                        mb={4}
                                        style={{ fontSize: "clamp(1.1rem, 2.2vw, 3rem)", letterSpacing: "0.15em" }}
                                    >
                                        {t.counterCode}
                                    </Text>
                                    <Text
                                        fw={900}
                                        c={theme.historyTextColor}
                                        style={{ fontSize: historyFontSize(t.code), lineHeight: 1, overflowWrap: "anywhere" }}
                                    >
                                        {t.code}
                                    </Text>
                                </Box>
                            ))}
                        </Box>
                    </ScrollArea>
                ) : (
                    <Box style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1rem, 2vw, 3rem)" }}>
                        <Text
                            c={theme.secondaryTextColor}
                            style={{ fontSize: "clamp(1rem, 1.8vw, 2.5rem)" }}
                        >
                            Waiting for calls…
                        </Text>
                    </Box>
                )}
                </Box>
            )}

            <style>{`
                @keyframes manualEntrance {
                    from { opacity: 0; transform: scale(0.82); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </Box>
    );
}
