function warn(message: string, err?: unknown) {
  if (import.meta.env?.DEV) console.warn(message, err);
}

let ctx: AudioContext | null = null;

/** Prime the audio context from a user gesture so playback is allowed later. */
export function primeAudio(): void {
  try {
    const Ctor = window.AudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    void ctx.resume();
  } catch (err) {
    warn("Audio unavailable", err);
  }
}

/** REQ-023: a short beep via Web Audio (no network, no assets). Never throws. */
export function playAlert(): void {
  try {
    const Ctor = window.AudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    warn("Could not play alert", err);
  }
}
