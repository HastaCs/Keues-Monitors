import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { videoSrc } from "../../../api/media";


interface Props {
    path: string;
    style?: CSSProperties;
}


export default function LocalVideo({ path, style }: Props) {

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [src, setSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        let mounted = true;

        void videoSrc(path).then(url => {
            if (mounted) setSrc(url);
        });

        return () => {
            mounted = false;
        };
    }, [path]);

    // Asegura el silencio en el webview (WebKitGTK puede ignorar el atributo `muted`
    // con autoplay): se fuerza la propiedad DOM y el volumen a 0.
    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        el.muted = true;
        el.defaultMuted = true;
        el.volume = 0;
    }, [src]);

    if (!src) return null;

    return (
        <video
            ref={videoRef}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            style={style}
        />
    );
}