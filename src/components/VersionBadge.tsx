import { Badge } from "@mantine/core";
import { APP_VERSION } from "../constants/app";

import type { CSSProperties } from "react";


interface Props {
    fixed?: boolean;
    style?: CSSProperties;
}


export default function VersionBadge({ fixed = true, style }: Props) {

    return (
        <Badge
            pos={fixed ? "fixed" : undefined}
            bottom={fixed ? 12 : undefined}
            right={fixed ? 12 : undefined}
            size="sm"
            variant="outline"
            color="black"
            radius="xl"
            style={{ zIndex: 100, ...style }}
        >
            v{APP_VERSION}
        </Badge>
    );
}