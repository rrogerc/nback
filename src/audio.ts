let audioContext: AudioContext | null = null;
const bufferCache = new Map<string, AudioBuffer>();

// --- Diagnostics (temporary, on-screen overlay reads from here) ---
type AudioDiag = {
  ctxState: string;
  sampleRate: number;
  loadAttempts: number;
  loadSuccess: number;
  loadErrors: string[];
  playAttempts: number;
  playStarted: number;
  playSkipped: number;
  playLastError: string;
  resumeCalls: number;
  unlockCalled: boolean;
};

const diag: AudioDiag = {
  ctxState: "uninit",
  sampleRate: 0,
  loadAttempts: 0,
  loadSuccess: 0,
  loadErrors: [],
  playAttempts: 0,
  playStarted: 0,
  playSkipped: 0,
  playLastError: "",
  resumeCalls: 0,
  unlockCalled: false,
};

const diagListeners = new Set<() => void>();
const notify = () => diagListeners.forEach((l) => l());

export function subscribeAudioDiag(cb: () => void): () => void {
  diagListeners.add(cb);
  return () => {
    diagListeners.delete(cb);
  };
}

export function getAudioDiag(): AudioDiag {
  return diag;
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    diag.ctxState = audioContext.state;
    diag.sampleRate = audioContext.sampleRate;
    audioContext.onstatechange = () => {
      diag.ctxState = audioContext!.state;
      notify();
    };
    notify();
  }
  return audioContext;
}

/**
 * Call SYNCHRONOUSLY inside a user gesture (click/tap) to unlock audio on iOS.
 * The silent-buffer play must happen within the gesture; awaiting ctx.resume()
 * first loses the gesture context on iOS Safari and leaves audio dead.
 */
export function unlockAudio(): void {
  diag.unlockCalled = true;
  const ctx = getAudioContext();
  // Play a silent buffer synchronously — this is what actually unlocks iOS.
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (e) {
    diag.playLastError = `unlock silent-buffer threw: ${
      (e as Error)?.message ?? e
    }`;
  }
  // Then transition state to "running" (fire-and-forget).
  if (ctx.state !== "running") {
    diag.resumeCalls++;
    ctx.resume().catch((e) => {
      diag.playLastError = `unlock resume threw: ${
        (e as Error)?.message ?? e
      }`;
      notify();
    });
  }
  notify();
}

/**
 * Resume a non-running AudioContext. Call from user-gesture handlers and
 * visibilitychange to recover after iOS suspends/interrupts the context
 * (tab switch, phone call, backgrounding a PWA).
 */
export function resumeAudio(): void {
  if (audioContext && audioContext.state !== "running") {
    diag.resumeCalls++;
    audioContext.resume().catch((e) => {
      diag.playLastError = `resumeAudio threw: ${(e as Error)?.message ?? e}`;
      notify();
    });
    notify();
  }
}

/** Fetch and decode audio files into AudioBuffers. Returns a map from key to buffer. */
export async function loadSounds(
  urls: Record<number, string>
): Promise<Record<number, AudioBuffer>> {
  const ctx = getAudioContext();
  diag.loadAttempts = Object.keys(urls).length;
  diag.loadSuccess = 0;
  diag.loadErrors = [];
  notify();

  const settled = await Promise.allSettled(
    Object.entries(urls).map(async ([key, url]) => {
      const cached = bufferCache.get(url);
      if (cached) return [Number(key), cached] as const;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`fetch ${response.status} ${url.split("/").pop()}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      bufferCache.set(url, audioBuffer);
      return [Number(key), audioBuffer] as const;
    })
  );

  const entries = settled.reduce<(readonly [number, AudioBuffer])[]>(
    (acc, result) => {
      if (result.status === "fulfilled") {
        acc.push(result.value);
      } else {
        const msg =
          result.reason instanceof Error
            ? `${result.reason.name}: ${result.reason.message}`
            : String(result.reason);
        diag.loadErrors.push(msg);
      }
      return acc;
    },
    []
  );
  diag.loadSuccess = entries.length;
  notify();
  return Object.fromEntries(entries);
}

/**
 * Play a pre-decoded AudioBuffer. If the context isn't running, awaits
 * resume() first so the source is started against a live timeline (otherwise
 * start(0) schedules into a frozen clock and the sound never plays).
 */
export async function playSound(buffer: AudioBuffer): Promise<void> {
  diag.playAttempts++;
  const ctx = getAudioContext();
  if (ctx.state !== "running") {
    try {
      diag.resumeCalls++;
      await ctx.resume();
    } catch (e) {
      diag.playSkipped++;
      diag.playLastError = `resume threw: ${(e as Error)?.message ?? e}`;
      notify();
      return;
    }
    // iOS can resolve resume() without actually transitioning to "running"
    // (e.g. when the PWA is in the background) — bail rather than scheduling
    // into a frozen timeline.
    if ((ctx.state as string) !== "running") {
      diag.playSkipped++;
      diag.playLastError = `state=${ctx.state} after resume`;
      notify();
      return;
    }
  }
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    diag.playStarted++;
  } catch (e) {
    diag.playLastError = `start threw: ${(e as Error)?.message ?? e}`;
  }
  notify();
}
