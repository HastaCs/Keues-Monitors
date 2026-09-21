import { Box, Center, Text } from "@mantine/core";

import type { LayoutProps } from "../../../types/layout";
import type { CalledTicket } from "../MonitorPanel";
import type { Counter } from "../../../types/models";
import SectionHeader from "./SectionHeader";
import ClockDisplay from "./ClockDisplay";
import CounterCard from "./CounterCard";
import { mutedText, panelBackgroundStyle } from "./shared";


export default function CountersLayout({ currentTicket, lastTickets, theme, counters }: LayoutProps) {

    // Último turno llamado por cada puesto, derivado solo de lo que ya hay en memoria.
    const latestByCode = new Map<string, CalledTicket>();
    for (const t of currentTicket ? [currentTicket, ...lastTickets] : lastTickets) {
        if (!t.counterCode) continue;
        const prev = latestByCode.get(t.counterCode);
        if (!prev || t.calledAt > prev.calledAt)
            latestByCode.set(t.counterCode, t);
    }

    // Todos los puestos del establecimiento (ya descargados) + cualquier código
    // visto en eventos que no esté en la lista.
    const known = counters ?? [];
    const byCode = new Map<string, Counter>();
    for (const c of known) byCode.set(c.code, c);

    const codes = new Set<string>(known.map(c => c.code));
    for (const code of latestByCode.keys()) codes.add(code);

    const sortedCodes = [...codes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    let mostRecentAt = -1;
    for (const t of latestByCode.values())
        mostRecentAt = Math.max(mostRecentAt, t.calledAt);

    const entries = sortedCodes.map(code => ({
        counter: byCode.get(code) ?? { id: code, code, name: code, description: "", color: "", queues: [] },
        ticket: latestByCode.get(code),
    }));

    const clockCorner = theme.showClock && (
        <Box pos="absolute" top={16} right={16} style={{ zIndex: 50 }}>
            <ClockDisplay theme={theme} />
        </Box>
    );


    return (
        <Box
            h="100vh"
            style={{
                ...panelBackgroundStyle(theme),
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <SectionHeader
                color={theme.labelTitleColor}
                center
                fontSize={theme.labelTitleSize ? `${theme.labelTitleSize}px` : undefined}
                padding="clamp(0.6rem, min(1.5vw, 2vh), 1.5rem) clamp(1.5rem, 3vw, 3.5rem) clamp(0.35rem, min(1vw, 1.2vh), 0.75rem)"
            >
                {theme.labelTitle}
            </SectionHeader>

            {entries.length > 0 ? (
                <Box
                    style={{
                        flex: 1,
                        minHeight: 0,
                        padding: "clamp(0.75rem, 1.5vw, 2rem)",
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gridTemplateRows: "repeat(3, 1fr)",
                        gap: "clamp(0.5rem, 1vw, 1.5rem)",
                    }}
                >
                    {entries.slice(0, 15).map(({ counter, ticket }) => (
                        <CounterCard
                            key={counter.code}
                            counter={counter}
                            ticketCode={ticket?.ticketCode}
                            isActive={ticket?.calledAt === mostRecentAt}
                            theme={theme}
                        />
                    ))}
                </Box>
            ) : (
                <Center style={{ flex: 1, minHeight: 0 }}>
                    <Box style={{ textAlign: "center" }}>
                        <Text
                            fw={300}
                            c={mutedText(theme)}
                            style={{ fontSize: "clamp(3rem, 12vh, 8rem)", lineHeight: 1 }}
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
                </Center>
            )}

            {clockCorner}
        </Box>
    );
}