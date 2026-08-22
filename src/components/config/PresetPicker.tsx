import { Box, Group, SimpleGrid, Text, UnstyledButton } from "@mantine/core";

import type { ThemePreset } from "./themePresets";


interface Props {
    presets: ThemePreset[];
    onSelect: (preset: ThemePreset) => void;
}


export default function PresetPicker({ presets, onSelect }: Props) {
    return (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            {presets.map(preset => (
                <UnstyledButton
                    key={preset.id}
                    onClick={() => onSelect(preset)}
                    style={{
                        border: "1px solid var(--mantine-color-gray-3)",
                        borderRadius: "var(--mantine-radius-md)",
                        padding: "10px 12px",
                        backgroundColor: "var(--mantine-color-white)",
                        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "var(--mantine-color-blue-4)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "var(--mantine-color-gray-3)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                    <Group gap={6} mb={6} wrap="nowrap">
                        <Box
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                background: preset.preview.background,
                                border: "1px solid var(--mantine-color-gray-3)",
                            }}
                        />
                        <Box
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                background: preset.preview.card,
                                border: "1px solid var(--mantine-color-gray-3)",
                            }}
                        />
                        <Box
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                background: preset.preview.accent,
                                border: "1px solid var(--mantine-color-gray-3)",
                            }}
                        />
                    </Group>
                    <Text size="sm" fw={500}>
                        {preset.label}
                    </Text>
                </UnstyledButton>
            ))}
        </SimpleGrid>
    );
}
