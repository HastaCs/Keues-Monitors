import { Box, Text } from "@mantine/core";

import type { CalledTicket } from "../MonitorPanel";
import type { MonitorTheme } from "../../../types/theme";
import { subtleBorder } from "./shared";


interface Props {
    ticket: CalledTicket;
    theme: MonitorTheme;
    opacity?: number;
}


export default function TicketHistoryCard({ ticket, theme, opacity = 1 }: Props) {

    return (
        <Box
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: ticket.counterCode ? "space-between" : "center",
                gap: "clamp(0.5rem, 1.5vw, 2rem)",
                padding: "clamp(0.5rem, min(1.2vw, 1.6vh), 1.5rem)",
                borderRadius: "clamp(0.75rem, 1.5vw, 2rem)",
                background: theme.historyCardBackground,
                border: `1px solid ${subtleBorder(theme)}`,
                opacity,
            }}
        >
            {ticket.counterCode && (
                <Text
                    fw={600}
                    c={theme.historySecondaryTextColor}
                    tt="uppercase"
                    style={{
                        fontSize: "clamp(0.9rem, min(2vw, 3vh), 2.5rem)",
                        lineHeight: 1,
                        letterSpacing: "0.06em",
                    }}
                >
                    {ticket.counterCode}
                </Text>
            )}
            <Text
                fw={800}
                c={theme.historyTextColor}
                style={{
                    fontSize: "clamp(1.4rem, min(4vw, 6vh), 5.5rem)",
                    lineHeight: 1,
                }}
            >
                {ticket.ticketCode}
            </Text>
        </Box>
    );
}
