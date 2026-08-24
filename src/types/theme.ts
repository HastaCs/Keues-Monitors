export type MonitorLayoutId = "spotlight" | "board";


export interface MonitorTheme {
    layout?: MonitorLayoutId;
    background: string;
    backgroundImage?: string;
    cardBackground: string;
    historyCardBackground: string;
    historyPanelBackground: string;
    historyTextColor: string;
    historySecondaryTextColor: string;
    historyHeaderColor: string;
    textColor: string;
    secondaryTextColor: string;
    labelTitleColor: string;
    labelTitleSize?: number;
    borderColor: string;
    borderWidth: number;
    historyHeader: string;
    showHistory: boolean;
    showClock?: boolean;
    clockTextColor?: string;
    labelTitle: string;
    labelFooter: string;
    voiceEnabled?: boolean;
    voiceId?: string;
    voicePrefix?: string;
    beepEnabled?: boolean;
}


export const DEFAULT_THEMES: Record<number, MonitorTheme> = {
    0: {
        layout: "spotlight",
        background: "#f8f9fa",
        cardBackground: "#ffffff",
        historyCardBackground: "#f8f9fa",
        historyPanelBackground: "#f8f9fa",
        historyTextColor: "#374151",
        historySecondaryTextColor: "#374151",
        historyHeaderColor: "#374151",
        textColor: "#1a1a2e",
        secondaryTextColor: "#374151",
        labelTitleColor: "#374151",
        borderColor: "#1a1a2e",
        borderWidth: 0,
        historyHeader: "Recent calls",
        showHistory: true,
        showClock: false,
        labelTitle: "Current ticket",
        labelFooter: "Please go to the counter",
    },
    1: {
        layout: "spotlight",
        background: "#f8f9fa",
        cardBackground: "#ffffff",
        historyCardBackground: "#f8f9fa",
        historyPanelBackground: "#f8f9fa",
        historyTextColor: "#1a6b3a",
        historySecondaryTextColor: "#374151",
        historyHeaderColor: "#374151",
        textColor: "#1a6b3a",
        secondaryTextColor: "#374151",
        labelTitleColor: "#374151",
        borderColor: "#1a6b3a",
        borderWidth: 0,
        historyHeader: "Free counters",
        showHistory: true,
        showClock: false,
        labelTitle: "Free counter",
        labelFooter: "Please go to the counter",
        voiceEnabled: false,
        voiceId: "es_ES-sharvard-medium.onnx",
        voicePrefix: "Please go to the counter",
    },
    2: {
        layout: "spotlight",
        background: "#f8f9fa",
        cardBackground: "#ffffff",
        historyCardBackground: "#f8f9fa",
        historyPanelBackground: "#f8f9fa",
        historyTextColor: "#6b7280",
        historySecondaryTextColor: "#6b7280",
        historyHeaderColor: "#6b7280",
        textColor: "#92400e",
        secondaryTextColor: "#6b7280",
        labelTitleColor: "#6b7280",
        borderColor: "#92400e",
        borderWidth: 0,
        historyHeader: "Other queues",
        showHistory: true,
        showClock: false,
        labelTitle: "Called number",
        labelFooter: "Please go to the counter",
    },
};


export function resolveTheme(flowType: number, overrides?: Partial<MonitorTheme>): MonitorTheme {
    const defaults = DEFAULT_THEMES[flowType] ?? DEFAULT_THEMES[2];
    return { ...defaults, ...overrides };
}
