import { Box, Center, ScrollArea } from "@mantine/core";

import type { LayoutProps } from "../../../types/layout";
import SectionHeader from "./SectionHeader";
import ClockDisplay from "./ClockDisplay";
import TicketCallout from "./TicketCallout";
import TicketHistoryCard from "./TicketHistoryCard";
import { buildHistory, panelBackgroundStyle, subtleBorder } from "./shared";


export default function SpotlightLayout({ currentTicket, lastTickets, theme }: LayoutProps) {

    const history = buildHistory(currentTicket, lastTickets);
    const border = subtleBorder(theme);
    const clockFooter = theme.showClock && (
        <Box
            style={{
                padding: "clamp(0.5rem, 1.5vw, 1.5rem)",
                borderTop: `1px solid ${border}`,
                display: "flex",
                justifyContent: "flex-end",
            }}
        >
            <ClockDisplay theme={theme} />
        </Box>
    );


    return (
        <Box
            h="100vh"
            style={{
                ...panelBackgroundStyle(theme),
                display: "flex",
                flexDirection: "row",
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Turno actual — zona principal (izquierda) */}
            <Box
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                <SectionHeader
                    color={theme.labelTitleColor}
                    center
                    fontSize={theme.labelTitleSize ? `${theme.labelTitleSize}px` : undefined}
                    padding="clamp(0.6rem, min(1.5vw, 2vh), 1.5rem) clamp(1.5rem, 4vw, 5rem) clamp(0.35rem, min(1vw, 1.2vh), 0.75rem)"
                >
                    {theme.labelTitle}
                </SectionHeader>

                <Center
                    style={{
                        flex: 1,
                        padding: "clamp(1rem, 3vw, 4rem)",
                        minHeight: 0,
                    }}
                >
                    <TicketCallout ticket={currentTicket} theme={theme} />
                </Center>
            </Box>

            {/* Histórico de últimos llamados — derecha */}
            {theme.showHistory && (
                <Box
                    style={{
                        width: "clamp(280px, 32vw, 45rem)",
                        display: "flex",
                        flexDirection: "column",
                        borderLeft: `2px solid ${border}`,
                        background: theme.historyPanelBackground,
                        minHeight: 0,
                    }}
                >
                    <SectionHeader color={theme.historyHeaderColor}>
                        {theme.historyHeader}
                    </SectionHeader>

                    {history.length > 0 && (
                        <ScrollArea style={{ flex: 1 }} type="never">
                            <Box
                                style={{
                                    padding: "clamp(0.75rem, 1.5vw, 2rem)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "clamp(0.5rem, 1vw, 1.5rem)",
                                }}
                            >
                                {history.map((t, i) => (
                                    <TicketHistoryCard
                                        key={t.ticketCode}
                                        ticket={t}
                                        theme={theme}
                                        opacity={Math.max(0.35, 1 - i * 0.07)}
                                    />
                                ))}
                            </Box>
                        </ScrollArea>
                    )}

                    {clockFooter}
                </Box>
            )}

            {!theme.showHistory && theme.showClock && (
                <Box pos="absolute" bottom={16} right={16} style={{ zIndex: 50 }}>
                    <ClockDisplay theme={theme} />
                </Box>
            )}
        </Box>
    );
}
