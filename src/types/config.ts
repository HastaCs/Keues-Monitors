import type { MonitorTheme } from "./theme";

export interface MonitorConfiguration {
    server: string;
    locationId: string | null;
    flowId: string | null;
    flowType: number | null;
    deviceId?: string;
    deviceName?: string;
    locationName?: string;
    flowName?: string;
    theme?: Record<number, Partial<MonitorTheme>>;
}
