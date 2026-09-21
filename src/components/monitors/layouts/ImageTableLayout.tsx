import { Box, Center, Text } from "@mantine/core";

import type { LayoutProps } from "../../../types/layout";
import SectionHeader from "./SectionHeader";
import ClockDisplay from "./ClockDisplay";
import TicketTableRow from "./TicketTableRow";
import { buildHistory, mutedText, subtleBorder } from "./shared";


export default function ImageTableLayout({ currentTicket, lastTickets, theme }: LayoutProps) {

    const history = theme.showHistory
        ? buildHistory(currentTicket, lastTickets).slice(0, 5)
        : [];
    const rows = currentTicket ? [currentTicket, ...history] : history;
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
                display: "flex",
                flexDirection: "row",
                overflow: "hidden",
                position: "relative",
                backgroundColor: theme.background,
            }}
        >
            {/* Imagen — 66% */}
            <Box
                style={{
                    width: "66%",
                    flexShrink: 0,
                    backgroundImage: theme.backgroundImage ? `url("${theme.backgroundImage}")` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {!theme.backgroundImage && (
                    <Text
                        fw={300}
                        c={mutedText(theme)}
                        style={{ fontSize: "clamp(1.5rem, 3vw, 4rem)" }}
                    >
                        No image configured
                    </Text>
                )}
            </Box>

            {/* Tabla — 33% */}
            <Box
                style={{
                    width: "34%",
                    flexShrink: 0,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    borderLeft: `2px solid ${border}`,
                    background: theme.historyPanelBackground,
                }}
            >
                <SectionHeader
                    color={theme.labelTitleColor}
                    center
                    fontSize={theme.labelTitleSize ? `${theme.labelTitleSize}px` : undefined}
                    padding="clamp(0.6rem, min(1.5vw, 2vh), 1.5rem) clamp(1rem, 2vw, 3rem) clamp(0.35rem, min(1vw, 1.2vh), 0.75rem)"
                >
                    {theme.labelTitle}
                </SectionHeader>

                {rows.length > 0 ? (
                    <Box
                        style={{
                            flex: 1,
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            borderTop: `2px solid ${border}`,
                        }}
                    >
                        {rows.map((t, i) => {
                            const isCurrent = Boolean(currentTicket) && i === 0;
                            return (
                                <Box
                                    key={`${t.ticketCode}-${t.calledAt}`}
                                    style={{
                                        flex: isCurrent ? 1.4 : 1,
                                        minHeight: 0,
                                        display: "flex",
                                        alignItems: "stretch",
                                    }}
                                >
                                    <TicketTableRow
                                        ticket={t}
                                        theme={theme}
                                        emphasized={isCurrent}
                                        showSeparator={i < rows.length - 1}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    <Center style={{ flex: 1, minHeight: 0 }}>
                        <Box style={{ textAlign: "center" }}>
                            <Text
                                fw={300}
                                c={mutedText(theme)}
                                style={{ fontSize: "clamp(3rem, 10vh, 7rem)", lineHeight: 1 }}
                            >
                                —
                            </Text>
                            <Text
                                c={theme.secondaryTextColor}
                                mt={8}
                                style={{ fontSize: "clamp(0.9rem, 1.6vw, 2.5rem)" }}
                            >
                                Waiting for tickets…
                            </Text>
                        </Box>
                    </Center>
                )}
            </Box>

            {clockCorner}
        </Box>
    );
}