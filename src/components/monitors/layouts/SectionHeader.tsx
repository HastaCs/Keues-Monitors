import { Box, Text } from "@mantine/core";

import type { ReactNode } from "react";


interface Props {
    children: ReactNode;
    color: string;
    padding?: string;
    center?: boolean;
    fontSize?: string;
}


export default function SectionHeader({ children, color, padding, center, fontSize }: Props) {
    return (
        <Box
            style={{
                padding: padding ?? "clamp(0.6rem, min(1.5vw, 2vh), 1.5rem) clamp(1.5rem, 3vw, 3.5rem) clamp(0.35rem, min(1vw, 1.2vh), 0.75rem)",
            }}
        >
            <Text
                fw={600}
                tt="uppercase"
                c={color}
                ta={center ? "center" : undefined}
                style={{ fontSize: fontSize ?? "clamp(0.9rem, min(1.6vw, 2.2vh), 2.4rem)", letterSpacing: "0.15em" }}
            >
                {children}
            </Text>
        </Box>
    );
}
