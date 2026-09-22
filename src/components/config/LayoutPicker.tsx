import { Box, SimpleGrid, Text, UnstyledButton } from "@mantine/core";
import type { CSSProperties } from "react";

import type { MonitorLayoutDefinition } from "../../types/layout";
import type { MonitorLayoutId, MonitorTheme } from "../../types/theme";


interface Props {
    layouts: MonitorLayoutDefinition[];
    currentId?: string;
    theme: MonitorTheme;
    onSelect: (id: MonitorLayoutId) => void;
}


// Mini-maqueta estilizada de cada layout, con los colores reales del tema.
function LayoutThumb({ id, theme }: { id: string; theme: MonitorTheme }) {

    const bg = theme.background;
    const panel = theme.historyPanelBackground;
    const card = theme.cardBackground;
    const accent = theme.borderColor;
    const text = theme.textColor;

    const base: CSSProperties = {
        border: "1px solid var(--mantine-color-gray-3)",
        borderRadius: 4,
        backgroundColor: bg,
    };

    return (
        <Box style={{ position: "relative", width: "100%", height: 64, overflow: "hidden", ...base }}>
            {id === "spotlight" && (
                <>
                    <Box style={{ position: "absolute", left: "6%", top: "14%", width: "56%", height: "58%", borderRadius: 3, backgroundColor: card, border: `2px solid ${accent}` }} />
                    <Box style={{ position: "absolute", right: "6%", top: "10%", width: "26%", height: "76%", borderRadius: 3, backgroundColor: panel }} />
                </>
            )}
            {id === "board" && (
                <>
                    <Box style={{ position: "absolute", left: "18%", top: "8%", width: "64%", height: "42%", borderRadius: 3, backgroundColor: card, border: `2px solid ${accent}` }} />
                    <Box style={{ position: "absolute", left: "6%", top: "56%", width: "88%", height: "36%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                        {[0, 1, 2, 3, 4, 5].map(i => (
                            <Box key={i} style={{ backgroundColor: card, borderRadius: 2, border: `1px solid ${accent}22` }} />
                        ))}
                    </Box>
                </>
            )}
            {id === "table" && (
                <>
                    {[0, 1, 2, 3].map(i => (
                        <Box key={i} style={{ position: "absolute", left: "6%", right: "6%", top: `${8 + i * 21}%`, height: `${i === 0 ? 22 : 16}%`, borderRadius: 2, backgroundColor: i === 0 ? text : card, border: `1px solid ${accent}22` }} />
                    ))}
                </>
            )}
            {id === "image" && (
                <>
                    <Box style={{ position: "absolute", left: 0, top: 0, width: "66%", height: "100%", backgroundImage: `linear-gradient(135deg, ${text}33, ${accent}22)` }} />
                    <Box style={{ position: "absolute", right: 0, top: 0, width: "34%", height: "100%", backgroundColor: panel }}>
                        {[0, 1, 2].map(i => (
                            <Box key={i} style={{ position: "absolute", left: "10%", right: "10%", top: `${10 + i * 28}%`, height: `${i === 0 ? 22 : 16}%`, borderRadius: 2, backgroundColor: i === 0 ? text : card }} />
                        ))}
                    </Box>
                </>
            )}
            {id === "counters" && (
                <Box style={{ position: "absolute", left: "5%", right: "5%", top: "8%", bottom: "8%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 3 }}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <Box key={i} style={{ backgroundColor: card, borderRadius: 3, border: `1px solid ${accent}22` }} />
                    ))}
                </Box>
            )}
        </Box>
    );
}


export default function LayoutPicker({ layouts, currentId, theme, onSelect }: Props) {
    return (
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
            {layouts.map(layout => {
                const selected = layout.id === currentId;
                return (
                    <UnstyledButton
                        key={layout.id}
                        onClick={() => onSelect(layout.id)}
                        style={{
                            border: selected ? "2px solid var(--mantine-color-blue-6)" : "1px solid var(--mantine-color-gray-3)",
                            borderRadius: "var(--mantine-radius-md)",
                            padding: "8px",
                            backgroundColor: selected ? "var(--mantine-color-blue-0)" : "var(--mantine-color-white)",
                            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                            cursor: "pointer",
                        }}
                    >
                        <LayoutThumb id={layout.id} theme={theme} />
                        <Text size="sm" fw={500} mt={6} ta="center">
                            {layout.label}
                        </Text>
                    </UnstyledButton>
                );
            })}
        </SimpleGrid>
    );
}