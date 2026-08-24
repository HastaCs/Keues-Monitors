const BEEP_URL = "sounds/beep.wav";

let audioCtx: AudioContext | null = null;
let beepBuffer: AudioBuffer | null = null;
let pendingSource: AudioBufferSourceNode | null = null;


async function loadBeepBuffer(ctx: AudioContext): Promise<AudioBuffer> {
    if (beepBuffer) return beepBuffer;

    const response = await fetch(BEEP_URL);
    if (!response.ok) {
        throw new Error(`Beep asset not available (${response.status})`);
    }

    beepBuffer = await ctx.decodeAudioData(await response.arrayBuffer());
    return beepBuffer;
}


// Resuelve cuando el beep termina de sonar, para poder encadenar
// anuncios de voz después sin solaparse.
export async function playBeep(): Promise<boolean> {
    try {
        const ctx = audioCtx ?? new AudioContext();
        audioCtx = ctx;

        if (ctx.state === "suspended")
            await ctx.resume();

        const audioBuffer = await loadBeepBuffer(ctx);

        pendingSource?.stop();

        return await new Promise<boolean>(resolve => {
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.onended = () => {
                if (pendingSource === source)
                    pendingSource = null;
                resolve(true);
            };

            pendingSource = source;
            source.start();
        });
    }
    catch {
        return false;
    }
}
