import { invoke } from "@tauri-apps/api/core";

import { isTauri } from "./appBridge";

import type { TTSVoice } from "../types/tts";


let audioCtx: AudioContext | null = null;
let pendingSource: AudioBufferSourceNode | null = null;


function getCtx(): AudioContext {
    const ctx = audioCtx ?? new AudioContext();
    audioCtx = ctx;
    return ctx;
}


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


// Sintetiza el texto con piper y devuelve el buffer decodificado sin reproducirlo,
// para poder lanzar la síntesis en paralelo con el beep y reproducir la voz
// justo cuando el beep termina.
export async function ttsSynthesize(text: string, voiceId?: string): Promise<AudioBuffer | null> {
    if (!isTauri()) return null;

    let result: { success: boolean; wav?: number[] };

    try {
        result = await invoke<{ success: boolean; wav?: number[] }>("tts_speak", { text, voiceId, rate: 1 });
    }
    catch {
        return null;
    }

    if (!result.success || !result.wav) return null;

    const wav = new Uint8Array(result.wav);
    const arrayBuffer = new ArrayBuffer(wav.byteLength);
    new Uint8Array(arrayBuffer).set(wav);

    try {
        return await getCtx().decodeAudioData(arrayBuffer);
    }
    catch {
        return null;
    }
}


export function ttsPlayBuffer(buffer: AudioBuffer): void {
    const ctx = getCtx();

    pendingSource?.stop();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
        if (pendingSource === source)
            pendingSource = null;
    };

    pendingSource = source;
    source.start();
}


export async function ttsSpeak(text: string, voiceId?: string): Promise<boolean> {
    const buffer = await ttsSynthesize(text, voiceId);
    if (!buffer) return false;

    ttsPlayBuffer(buffer);
    return true;
}


export function ttsStop() {
    pendingSource?.stop();
    pendingSource = null;

    if (isTauri())
        void invoke("tts_stop");
}
