import { Box, ScrollArea } from "@mantine/core";

import type { LayoutProps } from "../../../types/layout";
import SectionHeader from "./SectionHeader";
import ClockDisplay from "./ClockDisplay";
import TicketCallout from "./TicketCallout";
import TicketHistoryCard from "./TicketHistoryCard";
import { buildHistory, panelBackgroundStyle, subtleBorder } from "./shared";


export default function BoardLayout({ currentTicket, lastTickets, theme }: LayoutProps) {

    const history = buildHistory(currentTicket, lastTickets);
    const border = subtleBorder(theme);
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
            {/* Cabecera: turno actual */}
            <Box
                style={{
                    flex: theme.showHistory ? "0 0 55%" : "1",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                <SectionHeader color={theme.labelTitleColor} center fontSize={theme.labelTitleSize ? `${theme.labelTitleSize}px` : undefined}>
                    {theme.labelTitle}
                </SectionHeader>

                <Box
                    style={{
                        flex: 1,
                        minHeight: 0,
                        padding: "clamp(1rem, 3vw, 4rem)",
                        overflow: "hidden",
                    }}
                >
                    <TicketCallout ticket={currentTicket} theme={theme} />
                </Box>
            </Box>

            {/* Histórico — rejilla estilo panel de salidas */}
            {theme.showHistory && (
                <Box
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        borderTop: `2px solid ${border}`,
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
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(clamp(10rem, 18vw, 22rem), 1fr))",
                                    gap: "clamp(0.5rem, 1vw, 1.5rem)",
                                    alignContent: "start",
                                }}
                            >
                                {history.map(t => (
                                    <TicketHistoryCard key={t.ticketCode} ticket={t} theme={theme} />
                                ))}
                            </Box>
                        </ScrollArea>
                    )}
                </Box>
            )}

            {clockCorner}
        </Box>
    );
}
