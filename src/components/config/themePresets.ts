import type { MonitorTheme } from "../../types/theme";
import { DEFAULT_THEMES } from "../../types/theme";


export interface ThemePreset {
    id: string;
    label: string;
    preview: { background: string; card: string; accent: string };
    colors: Partial<MonitorTheme>;
}


// 4 paletas de color Mantine. "accent" para texto/números sobre fondos claros,
// "bright" para fondos oscuros y "tint" como fondo suave del preset.
interface ColorPalette {
    id: string;
    label: string;
    accent: string;
    bright: string;
    tint: string;
}

export const COLOR_PRESETS: ColorPalette[] = [
    { id: "blue", label: "Blue", accent: "#1864ab", bright: "#74c0fc", tint: "#e7f5ff" },   // blue.9 / blue.3 / blue.0
    { id: "green", label: "Green", accent: "#2f9e44", bright: "#8ce99a", tint: "#ebfbee" }, // green.8 / green.3 / green.0
    { id: "mono", label: "Black & White", accent: "#212529", bright: "#f8f9fa", tint: "#f1f3f5" }, // gray.9 / gray.0 / gray.1
    { id: "red", label: "Red", accent: "#c92a2a", bright: "#ffa8a8", tint: "#fff5f5" },     // red.9 / red.3 / red.0
];


// Swatches coherentes con la paleta Mantine, usados en todos los ColorInput
export const COLOR_SWATCHES = [
    "#ffffff",
    "#f8f9fa",
    "#f1f3f5",
    "#ced4da",
    "#adb5bd",
    "#868e96",
    "#495057",
    "#343a40",
    "#212529",
    "#228be6",
    "#1971c2",
    "#1864ab",
    "#40c057",
    "#37b24d",
    "#2f9e44",
    "#fd7e14",
    "#f76707",
    "#e8590c",
    "#fa5252",
    "#e03131",
    "#c92a2a",
];


// Los presets solo tocan colores/fondo. Nunca pisan textos, layout, voz ni showHistory.
export function getPresetsForFlow(flowType: number): ThemePreset[] {
    const defaults = DEFAULT_THEMES[flowType] ?? DEFAULT_THEMES[0];

    return COLOR_PRESETS.map(palette => ({
        id: palette.id,
        label: palette.label,
        preview: { background: palette.tint, card: "#ffffff", accent: palette.accent },
        colors: {
            background: palette.tint,
            cardBackground: "#ffffff",
            textColor: palette.accent,
            secondaryTextColor: "#495057",
            labelTitleColor: "#495057",
            borderColor: palette.accent,
            borderWidth: defaults.borderWidth,
            historyCardBackground: "#ffffff",
            historyPanelBackground: palette.tint,
            historyTextColor: palette.accent,
            historySecondaryTextColor: "#495057",
            historyHeaderColor: "#495057",
            clockTextColor: undefined,
        },
    }));
}