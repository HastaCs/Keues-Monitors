import { invoke } from "@tauri-apps/api/core";

import { isTauri } from "./appBridge";

import type { TTSVoice } from "../types/tts";


let audioCtx: AudioContext | null = null;
let pendingSource: AudioBufferSourceNode | null = null;


export async function ttsListVoices(): Promise<TTSVoice[]> {
    if (!isTauri()) return [];

    try {
        const result = await invoke<{ success: boolean; voices?: TTSVoice[] }>("tts_list_voices");
        return result.success && result.voices ? result.voices : [];
    }
    catch {
        return [];
    }
}


export async function ttsSpeak(text: string, voiceId?: string): Promise<boolean> {
    if (!isTauri()) return false;

    let result: { success: boolean; wav?: number[] };

    try {
        result = await invoke<{ success: boolean; wav?: number[] }>("tts_speak", { text, voiceId, rate: 1 });
    }
    catch {
        return false;
    }

    if (!result.success || !result.wav) return false;

    const wav = new Uint8Array(result.wav);
    const arrayBuffer = new ArrayBuffer(wav.byteLength);
    new Uint8Array(arrayBuffer).set(wav);

    const ctx = audioCtx ?? new AudioContext();
    audioCtx = ctx;

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    pendingSource?.stop();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => {
        pendingSource = null;
    };

    pendingSource = source;
    source.start();

    return true;
}


export function ttsStop() {
    pendingSource?.stop();
    pendingSource = null;

    if (isTauri())
        void invoke("tts_stop");
}
