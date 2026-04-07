let audioContext: AudioContext | null = null;
const bufferCache = new Map<string, AudioBuffer>();

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  return audioContext;
}

/** Call inside a user gesture (click/tap) to unlock audio on iOS. */
export async function unlockAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  // Play a silent buffer to fully unlock on iOS
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}

/**
 * Resume a suspended AudioContext. Call from user-gesture handlers
 * (touch/click) to recover audio after iOS re-suspends it
 * (e.g. tab switch, phone call).
 */
export function resumeAudio(): void {
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
}

/** Fetch and decode audio files into AudioBuffers. Returns a map from key to buffer. */
export async function loadSounds(
  urls: Record<number, string>
): Promise<Record<number, AudioBuffer>> {
  const ctx = getAudioContext();
  const entries = (
    await Promise.allSettled(
      Object.entries(urls).map(async ([key, url]) => {
        const cached = bufferCache.get(url);
        if (cached) return [Number(key), cached] as const;

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        bufferCache.set(url, audioBuffer);
        return [Number(key), audioBuffer] as const;
      })
    )
  ).reduce<(readonly [number, AudioBuffer])[]>((acc, result) => {
    if (result.status === "fulfilled") acc.push(result.value);
    return acc;
  }, []);
  return Object.fromEntries(entries);
}

/** Play a pre-decoded AudioBuffer with near-zero latency. */
export function playSound(buffer: AudioBuffer): void {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}
