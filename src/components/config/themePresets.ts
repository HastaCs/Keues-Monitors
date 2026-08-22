import type { MonitorTheme } from "../../types/theme";
import { DEFAULT_THEMES } from "../../types/theme";


export interface ThemePreset {
    id: string;
    label: string;
    preview: { background: string; card: string; accent: string };
    colors: Partial<MonitorTheme>;
}


// Acento de cada tipo de flujo: "light" para fondos claros, "bright" para fondos oscuros
const FLOW_ACCENT: Record<number, { light: string; bright: string }> = {
    0: { light: "#1a1a2e", bright: "#93c5fd" },
    1: { light: "#1a6b3a", bright: "#34d399" },
    2: { light: "#92400e", bright: "#fbbf24" },
};


// Swatches coherentes con la paleta del proyecto, usados en todos los ColorInput
export const COLOR_SWATCHES = [
    "#f8f9fa",
    "#ffffff",
    "#111827",
    "#1f2937",
    "#1a1a2e",
    "#1a6b3a",
    "#92400e",
    "#374151",
    "#6b7280",
    "#d1d5db",
];


// Los presets solo tocan colores/fondo. Nunca pisan textos, layout, voz ni showHistory.
export function getPresetsForFlow(flowType: number): ThemePreset[] {
    const defaults = DEFAULT_THEMES[flowType] ?? DEFAULT_THEMES[0];
    const accent = FLOW_ACCENT[flowType] ?? FLOW_ACCENT[0];

    return [
        {
            id: "default",
            label: "Default",
            preview: { background: defaults.background, card: defaults.cardBackground, accent: accent.light },
            colors: {
                background: defaults.background,
                cardBackground: defaults.cardBackground,
                textColor: defaults.textColor,
                secondaryTextColor: defaults.secondaryTextColor,
                labelTitleColor: defaults.labelTitleColor,
                borderColor: defaults.borderColor,
                borderWidth: defaults.borderWidth,
                historyCardBackground: defaults.historyCardBackground,
                historyPanelBackground: defaults.historyPanelBackground,
                historyTextColor: defaults.historyTextColor,
                historySecondaryTextColor: defaults.historySecondaryTextColor,
                historyHeaderColor: defaults.historyHeaderColor,
                clockTextColor: undefined,
            },
        },
        {
            id: "dark",
            label: "Dark",
            preview: { background: "#111827", card: "#1f2937", accent: accent.bright },
            colors: {
                background: "#111827",
                cardBackground: "#1f2937",
                textColor: accent.bright,
                secondaryTextColor: "#d1d5db",
                labelTitleColor: "#e5e7eb",
                borderColor: accent.bright,
                borderWidth: defaults.borderWidth,
                historyCardBackground: "#1f2937",
                historyPanelBackground: "#0b1220",
                historyTextColor: accent.bright,
                historySecondaryTextColor: "#d1d5db",
                historyHeaderColor: "#e5e7eb",
                clockTextColor: "#e5e7eb",
            },
        },
        {
            id: "soft",
            label: "Soft",
            preview: { background: "#fdf6f0", card: "#ffffff", accent: accent.light },
            colors: {
                background: "#fdf6f0",
                cardBackground: "#ffffff",
                textColor: accent.light,
                secondaryTextColor: "#6b7280",
                labelTitleColor: "#6b7280",
                borderColor: accent.light,
                borderWidth: defaults.borderWidth,
                historyCardBackground: "#ffffff",
                historyPanelBackground: "#faf3ec",
                historyTextColor: accent.light,
                historySecondaryTextColor: "#6b7280",
                historyHeaderColor: "#6b7280",
                clockTextColor: undefined,
            },
        },
        {
            id: "contrast",
            label: "Contrast",
            preview: { background: "#ffffff", card: "#ffffff", accent: accent.light },
            colors: {
                background: "#ffffff",
                cardBackground: "#ffffff",
                textColor: accent.light,
                secondaryTextColor: "#111827",
                labelTitleColor: "#111827",
                borderColor: accent.light,
                borderWidth: 4,
                historyCardBackground: "#ffffff",
                historyPanelBackground: "#f8f9fa",
                historyTextColor: accent.light,
                historySecondaryTextColor: "#111827",
                historyHeaderColor: "#111827",
                clockTextColor: undefined,
            },
        },
    ];
}
