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
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  // Play a silent buffer to fully unlock on iOS
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}

/** Fetch and decode audio files into AudioBuffers. Returns a map from key to buffer. */
export async function loadSounds(
  urls: Record<number, string>
): Promise<Record<number, AudioBuffer>> {
  const ctx = getAudioContext();
  const entries = await Promise.all(
    Object.entries(urls).map(async ([key, url]) => {
      const cached = bufferCache.get(url);
      if (cached) return [Number(key), cached] as const;

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      bufferCache.set(url, audioBuffer);
      return [Number(key), audioBuffer] as const;
    })
  );
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
