let audioCtx: AudioContext | null = null;
let bgmInterval: ReturnType<typeof setInterval> | null = null;
let bgmPlaying = false;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.1,
  delay = 0
): void {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {
    // Audio may not be available
  }
}

function playSweep(
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = "sawtooth",
  volume = 0.1,
  delay = 0
): void {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + delay + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {
    // Audio may not be available
  }
}

function playNoise(duration: number, volume = 0.08, delay = 0): void {
  try {
    const ctx = getAudioCtx();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 3000;
    bandpass.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    source.start(ctx.currentTime + delay);
    source.stop(ctx.currentTime + delay + duration);
  } catch {
    // Audio may not be available
  }
}

// ─── SFX ───

export function playWalkSound(): void {
  playTone(180, 0.03, "triangle", 0.06);
}

export function playFallSound(): void {
  playSweep(400, 100, 0.3, "sawtooth", 0.08);
}

export function playPepperSound(): void {
  playNoise(0.25, 0.1);
  playTone(600, 0.08, "square", 0.04);
}

export function playDeathSound(): void {
  // Descending staircase — dramatic arcade death
  const notes = [440, 370, 311, 262, 220, 165];
  notes.forEach((freq, i) => {
    playTone(freq, 0.15, "square", 0.1, i * 0.12);
  });
  playSweep(165, 80, 0.4, "sawtooth", 0.08, notes.length * 0.12);
}

export function playEnemySquashSound(): void {
  playSweep(200, 800, 0.12, "square", 0.1);
  playTone(800, 0.08, "square", 0.08, 0.1);
}

export function playBurgerCompleteSound(): void {
  // Rising fanfare with harmony
  const melody = [523, 659, 784, 1047];
  melody.forEach((freq, i) => {
    playTone(freq, 0.15, "square", 0.08, i * 0.1);
    playTone(freq * 0.75, 0.15, "triangle", 0.04, i * 0.1);
  });
}

export function playLevelCompleteSound(): void {
  // Triumphant ascending phrase with chords
  const notes = [523, 587, 659, 784, 880, 1047];
  notes.forEach((freq, i) => {
    playTone(freq, 0.2, "square", 0.08, i * 0.12);
    playTone(freq * 0.8, 0.2, "triangle", 0.04, i * 0.12);
  });
  // Final sustained chord
  playTone(1047, 0.5, "square", 0.06, notes.length * 0.12);
  playTone(784, 0.5, "triangle", 0.04, notes.length * 0.12);
  playTone(659, 0.5, "triangle", 0.03, notes.length * 0.12);
}

export function playBonusSound(): void {
  playSweep(800, 1600, 0.08, "square", 0.08);
  playTone(1600, 0.1, "square", 0.06, 0.06);
}

export function playGetReadySound(): void {
  // Quick ascending 3-note intro
  const notes = [330, 440, 554];
  notes.forEach((freq, i) => {
    playTone(freq, 0.12, "square", 0.08, i * 0.15);
  });
}

export function playGameOverSound(): void {
  // Slow descending sad phrase
  const notes = [392, 349, 330, 294, 262];
  notes.forEach((freq, i) => {
    playTone(freq, 0.3, "triangle", 0.1, i * 0.25);
  });
  playSweep(262, 131, 0.6, "triangle", 0.06, notes.length * 0.25);
}

export function playExtraLifeSound(): void {
  // Quick triumphant arpeggio
  const notes = [523, 659, 784, 1047, 784, 1047];
  notes.forEach((freq, i) => {
    playTone(freq, 0.1, "square", 0.07, i * 0.07);
  });
}

// ─── Background Music ───

const BGM_TEMPO = 200; // ms per note
const BGM_MELODY: { freq: number; dur: number }[] = [
  // Simple catchy loop inspired by arcade BurgerTime
  { freq: 330, dur: 0.5 },
  { freq: 392, dur: 0.5 },
  { freq: 440, dur: 0.5 },
  { freq: 392, dur: 0.5 },
  { freq: 330, dur: 0.5 },
  { freq: 294, dur: 0.5 },
  { freq: 330, dur: 1.0 },
  { freq: 0, dur: 0.5 },   // rest
  { freq: 294, dur: 0.5 },
  { freq: 330, dur: 0.5 },
  { freq: 392, dur: 0.5 },
  { freq: 330, dur: 0.5 },
  { freq: 294, dur: 0.5 },
  { freq: 262, dur: 0.5 },
  { freq: 294, dur: 1.0 },
  { freq: 0, dur: 0.5 },   // rest
  { freq: 392, dur: 0.5 },
  { freq: 440, dur: 0.5 },
  { freq: 523, dur: 0.5 },
  { freq: 440, dur: 0.5 },
  { freq: 392, dur: 0.5 },
  { freq: 330, dur: 0.5 },
  { freq: 392, dur: 0.5 },
  { freq: 440, dur: 0.5 },
  { freq: 330, dur: 0.5 },
  { freq: 294, dur: 0.5 },
  { freq: 262, dur: 0.5 },
  { freq: 294, dur: 0.5 },
  { freq: 330, dur: 1.0 },
  { freq: 0, dur: 0.5 },   // rest
];

const BGM_BASS: { freq: number; dur: number }[] = [
  { freq: 131, dur: 1.0 },
  { freq: 131, dur: 1.0 },
  { freq: 165, dur: 1.0 },
  { freq: 131, dur: 1.0 },
  { freq: 0, dur: 0.5 },
  { freq: 147, dur: 1.0 },
  { freq: 147, dur: 1.0 },
  { freq: 131, dur: 1.0 },
  { freq: 147, dur: 1.0 },
  { freq: 0, dur: 0.5 },
  { freq: 165, dur: 1.0 },
  { freq: 165, dur: 1.0 },
  { freq: 131, dur: 1.0 },
  { freq: 131, dur: 1.0 },
  { freq: 147, dur: 1.0 },
  { freq: 131, dur: 1.0 },
  { freq: 0, dur: 0.5 },
];

let melodyIndex = 0;
let bassIndex = 0;
let melodyWait = 0;
let bassWait = 0;

export function startBgm(): void {
  if (bgmPlaying) return;
  bgmPlaying = true;
  melodyIndex = 0;
  bassIndex = 0;
  melodyWait = 0;
  bassWait = 0;

  bgmInterval = setInterval(() => {
    if (!bgmPlaying) return;

    // Advance melody
    if (melodyWait <= 0) {
      const note = BGM_MELODY[melodyIndex % BGM_MELODY.length];
      if (note && note.freq > 0) {
        playTone(note.freq, note.dur * (BGM_TEMPO / 1000) * 0.9, "square", 0.04);
      }
      melodyWait = note ? note.dur : 0.5;
      melodyIndex++;
    }
    melodyWait -= 0.5;

    // Advance bass
    if (bassWait <= 0) {
      const note = BGM_BASS[bassIndex % BGM_BASS.length];
      if (note && note.freq > 0) {
        playTone(note.freq, note.dur * (BGM_TEMPO / 1000) * 0.9, "triangle", 0.03);
      }
      bassWait = note ? note.dur : 0.5;
      bassIndex++;
    }
    bassWait -= 0.5;
  }, BGM_TEMPO / 2);
}

export function stopBgm(): void {
  bgmPlaying = false;
  if (bgmInterval !== null) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}

// ─── Init ───

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
