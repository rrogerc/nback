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

/**
 * Call SYNCHRONOUSLY inside a user gesture (click/tap) to unlock audio on iOS.
 * The silent-buffer play must happen within the gesture; awaiting ctx.resume()
 * first loses the gesture context on iOS Safari and leaves audio dead.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  // Play a silent buffer synchronously — this is what actually unlocks iOS.
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    /* ignore */
  }
  // Then transition state to "running" (fire-and-forget).
  if (ctx.state !== "running") {
    ctx.resume().catch(() => {});
  }
}

/**
 * Resume a non-running AudioContext. Call from user-gesture handlers and
 * visibilitychange to recover after iOS suspends/interrupts the context
 * (tab switch, phone call, backgrounding a PWA).
 */
export function resumeAudio(): void {
  if (audioContext && audioContext.state !== "running") {
    audioContext.resume().catch(() => {});
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

/**
 * Play a pre-decoded AudioBuffer. If the context isn't running, awaits
 * resume() first so the source is started against a live timeline (otherwise
 * start(0) schedules into a frozen clock and the sound never plays).
 */
export async function playSound(buffer: AudioBuffer): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
    // iOS can resolve resume() without actually transitioning to "running"
    // (e.g. when the PWA is in the background) — bail rather than scheduling
    // into a frozen timeline.
    if ((ctx.state as string) !== "running") return;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}
