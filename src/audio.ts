let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "square"): void {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio may not be available
  }
}

export function playWalkSound(): void {
  playTone(200, 0.05);
}

export function playFallSound(): void {
  playTone(150, 0.2, "sawtooth");
}

export function playPepperSound(): void {
  playTone(800, 0.15, "square");
}

export function playDeathSound(): void {
  playTone(100, 0.5, "sawtooth");
}

export function playEnemySquashSound(): void {
  playTone(400, 0.1);
  setTimeout(() => playTone(300, 0.1), 100);
}

export function playBurgerCompleteSound(): void {
  playTone(523, 0.1);
  setTimeout(() => playTone(659, 0.1), 100);
  setTimeout(() => playTone(784, 0.2), 200);
}

export function playLevelCompleteSound(): void {
  const notes = [523, 587, 659, 698, 784];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15), i * 150);
  });
}

export function playBonusSound(): void {
  playTone(1000, 0.1);
  setTimeout(() => playTone(1200, 0.1), 80);
}

export function initAudio(): void {
  // Audio context is created lazily on first user interaction
  document.addEventListener(
    "click",
    () => {
      getAudioCtx();
    },
    { once: true }
  );
  document.addEventListener(
    "keydown",
    () => {
      getAudioCtx();
    },
    { once: true }
  );
}
