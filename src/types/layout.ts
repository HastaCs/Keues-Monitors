import type { ComponentType } from "react";

import type { CalledTicket } from "../components/monitors/MonitorPanel";
import type { MonitorTheme, MonitorLayoutId } from "./theme";


export interface LayoutProps {
    currentTicket: CalledTicket | null;
    lastTickets: CalledTicket[];
    theme: MonitorTheme;
}


export interface MonitorLayoutDefinition {
    id: MonitorLayoutId;
    label: string;
    component: ComponentType<LayoutProps>;
}
