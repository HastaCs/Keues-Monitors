import SpotlightLayout from "./SpotlightLayout";
import BoardLayout from "./BoardLayout";
import TableLayout from "./TableLayout";
import ImageTableLayout from "./ImageTableLayout";

import type { MonitorLayoutDefinition } from "../../../types/layout";


export const LAYOUTS_BY_FLOW: Record<number, MonitorLayoutDefinition[]> = {
    0: [
        { id: "spotlight", label: "Spotlight", component: SpotlightLayout },
        { id: "board", label: "Board", component: BoardLayout },
        { id: "table", label: "Table", component: TableLayout },
        { id: "image", label: "Image + Table", component: ImageTableLayout },
    ],
};


export function resolveLayout(flowType: number, id?: string): MonitorLayoutDefinition {
    const layouts = LAYOUTS_BY_FLOW[flowType] ?? LAYOUTS_BY_FLOW[0] ?? [];
    return layouts.find(l => l.id === id) ?? layouts[0];
}
