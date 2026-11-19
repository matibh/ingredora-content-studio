export type SoundtrackOptions = {
  durationSeconds: number;
  sampleRate?: number;
  theme?: "summer-poolside";
};

/**
 * Creates an original, deterministic instrumental bed with Web Audio synthesis.
 * It renders offline, so it does not depend on autoplay permissions or user gestures.
 */
export async function generateOriginalSoundtrack({
  durationSeconds,
  sampleRate = 48_000,
  theme,
}: SoundtrackOptions): Promise<AudioBuffer> {
  if (typeof OfflineAudioContext === "undefined") {
    throw new Error("Este navegador no admite generación de audio offline.");
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 180) {
    throw new Error("Duración de banda sonora fuera del rango permitido.");
  }

  const frameCount = Math.ceil(durationSeconds * sampleRate);
  const context = new OfflineAudioContext(2, frameCount, sampleRate);
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  master.gain.setValueAtTime(0.0001, 0);
  master.gain.linearRampToValueAtTime(0.72, Math.min(0.8, durationSeconds * 0.12));
  master.gain.setValueAtTime(0.72, Math.max(0.8, durationSeconds - 0.55));
  master.gain.linearRampToValueAtTime(0.0001, durationSeconds);
  compressor.threshold.value = -18;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.22;
  master.connect(compressor);
  compressor.connect(context.destination);

  const beat = 60 / 108;
  const bar = beat * 4;
  const progression = [
    { bass: 65.41, chord: [261.63, 329.63, 392.0] },
    { bass: 55.0, chord: [220.0, 261.63, 329.63] },
    { bass: 87.31, chord: [349.23, 440.0, 523.25] },
    { bass: 98.0, chord: [392.0, 493.88, 587.33] },
  ];
  const melody = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 783.99, 880.0, 783.99, 659.25, 587.33];

  const addTone = (
    frequency: number,
    start: number,
    duration: number,
    waveform: OscillatorType,
    peak: number,
    filterFrequency: number,
    pan = 0,
  ) => {
    if (start >= durationSeconds) return;
    const end = Math.min(durationSeconds, start + duration);
    const length = end - start;
    if (length <= 0) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const panner = context.createStereoPanner();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFrequency, start);
    filter.Q.value = 0.7;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(peak, start + Math.min(0.025, length * 0.25));
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    panner.pan.setValueAtTime(pan, start);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(panner);
    panner.connect(master);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  };

  // Soft sustained chord layers: warm, unobtrusive and loop-like.
  for (let start = 0, index = 0; start < durationSeconds; start += bar, index += 1) {
    const chord = progression[index % progression.length];
    const chordDuration = Math.min(bar * 0.98, durationSeconds - start);
    chord.chord.forEach((frequency, noteIndex) => {
      addTone(frequency, start, chordDuration, "sine", 0.055, 1_600, (noteIndex - 1) * 0.38);
      addTone(frequency * 2, start + 0.015, chordDuration * 0.92, "triangle", 0.012, 2_400, (1 - noteIndex) * 0.3);
    });
    addTone(chord.bass, start, Math.min(bar * 0.9, durationSeconds - start), "triangle", 0.12, 260, 0);
    addTone(chord.bass * 2, start + beat * 2, Math.min(beat * 1.6, durationSeconds - start - beat * 2), "sine", 0.035, 420, 0);
  }

  // Bright plucked motif and restrained low percussion.
  const eighth = beat / 2;
  let step = 0;
  for (let start = 0; start < durationSeconds; start += eighth, step += 1) {
    const note = melody[(step + Math.floor(step / 16) * 2) % melody.length];
    if (step % 2 === 0) addTone(note, start, 0.24, "triangle", 0.07, 3_200, step % 4 === 0 ? -0.22 : 0.22);
    if (step % 4 === 0) {
      const kick = context.createOscillator();
      const gain = context.createGain();
      kick.type = "sine";
      kick.frequency.setValueAtTime(105, start);
      kick.frequency.exponentialRampToValueAtTime(43, Math.min(durationSeconds, start + 0.12));
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSeconds, start + 0.19));
      kick.connect(gain);
      gain.connect(master);
      kick.start(start);
      kick.stop(Math.min(durationSeconds, start + 0.2));
    }
  }

  // Quiet, filtered noise ticks add movement without using any external samples.
  let seed = 0x1a2b3c4d;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };
  const noiseLength = Math.max(1, Math.ceil(sampleRate * 0.055));
  const noiseBuffer = context.createBuffer(1, noiseLength, sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i += 1) noiseData[i] = (random() * 2 - 1) * (1 - i / noiseLength);
  for (let start = beat; start < durationSeconds; start += beat) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createStereoPanner();
    source.buffer = noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = 5_000;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.018, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSeconds, start + 0.055));
    panner.pan.value = start % (beat * 2) === 0 ? -0.45 : 0.45;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(master);
    source.start(start);
  }


  if (theme === "summer-poolside") {
    // Original procedural summer SFX: fizz/pour texture, ice clinks, freeze hit,
    // one-second countdown ticks and a short reveal chime. No external samples.
    const fizzLength = Math.ceil(sampleRate * 0.24);
    const fizzBuffer = context.createBuffer(1, fizzLength, sampleRate);
    const fizzData = fizzBuffer.getChannelData(0);
    for (let i = 0; i < fizzLength; i += 1) {
      const fade = Math.pow(1 - i / fizzLength, 1.6);
      fizzData[i] = (random() * 2 - 1) * fade;
    }
    for (let start = 3.90; start < 6.45; start += 0.19 {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = fizzBuffer;
      filter.type = "bandpass";
      filter.frequency.value = 4_800 + random() * 1_700;
      filter.Q.value = 0.62;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.026, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSeconds, start + 0.24));
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(start);
    }
    addTone(1_480, 3.34, 0.16, "sine", 0.075, 6_000, -0.24);
    addTone(1_960, 3.42, 0.13, "sine", 0.055, 7_000, 0.24);
    addTone(1_180, 4.12, 0.18, "triangle", 0.04, 5_000, 0.18);
    addTone(92, 7.18, 0.42, "sine", 0.18, 420, 0);
    addTone(740, 7.20, 0.36, "triangle", 0.035, 3_600, 0);
    for (let second = 10; second < 16; second += 1) {
      const finalTick = second >= 14;
      addTone(finalTick ? 1_120 : 880, second, 0.065, "sine", finalTick ? 0.052 : 0.032, 4_200, 0);
    }
    addTone(523.25, 16.02, 0.48, "sine", 0.07, 4_800, -0.18);
    addTone(659.25, 16.10, 0.52, "sine", 0.06, 5_200, 0.12);
    addTone(783.99, 16.18, 0.62, "triangle", 0.055, 5_600, 0.28);
  }

  return context.startRendering();
}
