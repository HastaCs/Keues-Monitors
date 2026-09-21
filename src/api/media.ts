import { convertFileSrc } from "@tauri-apps/api/core";

import { isTauri } from "./appBridge";
import { proxyBase } from "./net";


// URL reproducible de un vídeo local. En Tauri se sirve a través del proxy
// HTTP de Rust (`/__media`), porque WebKitGTK no reproduce media por esquemas
// URI personalizados (`asset:`). En navegador se devuelve la ruta cruda.
export async function videoSrc(path?: string): Promise<string | undefined> {
    if (!path) return undefined;
    if (!isTauri()) return path;

    const base = await proxyBase();
    return `${base}/__media?path=${encodeURIComponent(path)}`;
}


// Convierte una ruta local en una URL cargable por el webview (solo imágenes;
// para vídeo usar videoSrc).
export function mediaSrc(path?: string): string | undefined {
    if (!path) return undefined;
    return isTauri() ? convertFileSrc(path) : path;
}