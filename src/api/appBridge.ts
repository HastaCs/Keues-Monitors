import { invoke } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";

import type { MonitorConfiguration } from "../types/config";

export interface UpdateState {
    state: "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error";
    version?: string;
    percent?: number;
    error?: string;
}

export interface BridgeResponse {
    success: boolean;
    error?: string;
}

type UpdateListener = (state: UpdateState) => void;

type UpdaterUpdate = NonNullable<Awaited<ReturnType<typeof check>>>;

let currentUpdate: UpdaterUpdate | null = null;
let updateListener: UpdateListener | null = null;

function emit(state: UpdateState) {
    updateListener?.(state);
}

export function isTauri(): boolean {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function saveConfiguration(config: MonitorConfiguration): Promise<{ success: boolean; config?: MonitorConfiguration; error?: string }> {
    return invoke("save_config", { config });
}

export async function loadConfiguration(): Promise<{ success: boolean; config: MonitorConfiguration | null }> {
    return invoke("load_config");
}

export function onUpdateState(callback: UpdateListener): () => void {
    updateListener = callback;
    return () => {
        if (updateListener === callback)
            updateListener = null;
    };
}

export async function checkForUpdates(): Promise<BridgeResponse> {
    emit({ state: "checking" });

    try {
        const update = await check();
        currentUpdate = update;

        if (update) {
            emit({ state: "available", version: update.version });
        } else {
            emit({ state: "not-available" });
        }

        return { success: true };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Could not check for updates";
        emit({ state: "error", error: message });
        return { success: false, error: message };
    }
}

export async function downloadUpdate(): Promise<BridgeResponse> {
    if (!currentUpdate) {
        const message = "No update available";
        emit({ state: "error", error: message });
        return { success: false, error: message };
    }

    const version = currentUpdate.version;
    emit({ state: "downloading", percent: 0, version });

    try {
        let total = 0;

        await currentUpdate.download((event) => {
            if (event.event === "Started") {
                total = event.data.contentLength ?? 0;
            }
            else if (event.event === "Progress") {
                const chunkLength = event.data.chunkLength;
                if (total > 0) {
                    const percent = Math.round((chunkLength / total) * 100);
                    emit({ state: "downloading", percent, version });
                }
            }
        });

        emit({ state: "downloaded", version });
        return { success: true };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Could not download the update";
        emit({ state: "error", error: message });
        return { success: false, error: message };
    }
}

export async function installUpdate(): Promise<BridgeResponse> {
    if (!currentUpdate) {
        const message = "No update available";
        emit({ state: "error", error: message });
        return { success: false, error: message };
    }

    try {
        await currentUpdate.install();
        return { success: true };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Could not install the update";
        return { success: false, error: message };
    }
}
