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
    historyBorderColor?: string;
    historyBorderWidth?: number;
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
        historyTextColor: "#495057",
        historySecondaryTextColor: "#495057",
        historyHeaderColor: "#495057",
        textColor: "#1864ab",
        secondaryTextColor: "#495057",
        labelTitleColor: "#495057",
        borderColor: "#1864ab",
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
        historyTextColor: "#2f9e44",
        historySecondaryTextColor: "#495057",
        historyHeaderColor: "#495057",
        textColor: "#2f9e44",
        secondaryTextColor: "#495057",
        labelTitleColor: "#495057",
        borderColor: "#2f9e44",
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
        historyTextColor: "#868e96",
        historySecondaryTextColor: "#868e96",
        historyHeaderColor: "#868e96",
        textColor: "#e8590c",
        secondaryTextColor: "#868e96",
        labelTitleColor: "#868e96",
        borderColor: "#e8590c",
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
