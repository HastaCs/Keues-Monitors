import { useEffect, useState } from "react";
import { Stack, Text } from "@mantine/core";

import type { MonitorTheme } from "../../../types/theme";


interface Props {
    theme: MonitorTheme;
}


export default function ClockDisplay({ theme }: Props) {

    const [now, setNow] = useState(() => new Date());


    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);


    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const dateStr = now.toLocaleDateString(undefined, { day: "numeric", month: "numeric", year: "numeric" });
    const timeColor = theme.clockTextColor ?? theme.textColor;
    const dateColor = theme.clockTextColor ?? theme.secondaryTextColor;


    return (
        <Stack align="flex-end" gap={0}>
            <Text
                fw={800}
                c={timeColor}
                style={{
                    fontSize: "clamp(2rem, min(5vw, 7vh), 6rem)",
                    lineHeight: 1.1,
                    letterSpacing: "0.02em",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {hours}:{minutes}
            </Text>
            <Text
                fw={500}
                c={dateColor}
                style={{
                    fontSize: "clamp(1.2rem, min(2.6vw, 3.5vh), 3rem)",
                    lineHeight: 1.2,
                }}
            >
                {dateStr}
            </Text>
        </Stack>
    );
}
