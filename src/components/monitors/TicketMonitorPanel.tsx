import type { CalledTicket } from "./MonitorPanel";
import type { MonitorTheme } from "../../types/theme";
import { resolveLayout } from "./layouts";


interface Props {
    currentTicket: CalledTicket | null;
    lastTickets: CalledTicket[];
    theme: MonitorTheme;
}


export default function TicketMonitorPanel({ currentTicket, lastTickets, theme }: Props) {

    const layout = resolveLayout(0, theme.layout);
    const Layout = layout.component;

    return (
        <Layout
            currentTicket={currentTicket}
            lastTickets={lastTickets}
            theme={theme}
        />
    );
}
