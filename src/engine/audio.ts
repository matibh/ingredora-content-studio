export type SoundtrackOptions = {
  durationSeconds: number;
  sampleRate?: number;
  theme?: "summer-poolside" | "family-merienda" | "game-show" | "detective-case" | "sitcom-intro";
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
  const masterLevel = theme === "detective-case" ? 0.94 : theme === "sitcom-intro" ? 0.96 : 0.72;
  if (theme === "sitcom-intro") {
    // Short opening signature, silence under the dialogue, then a full branded
    // closing cue for the final eight seconds of the episode.
    const closingMusicStart = Math.max(5.8, durationSeconds - 8.0);
    master.gain.linearRampToValueAtTime(masterLevel, 0.12);
    master.gain.setValueAtTime(masterLevel, 4.78);
    master.gain.linearRampToValueAtTime(0.0001, 5.35);
    master.gain.setValueAtTime(0.0001, closingMusicStart);
    master.gain.linearRampToValueAtTime(masterLevel, closingMusicStart + 0.28);
    master.gain.setValueAtTime(masterLevel, Math.max(closingMusicStart + 0.29, durationSeconds - 0.65));
    master.gain.linearRampToValueAtTime(0.0001, durationSeconds);
  } else {
    master.gain.linearRampToValueAtTime(masterLevel, Math.min(0.8, durationSeconds * 0.12));
    master.gain.setValueAtTime(masterLevel, Math.max(0.8, durationSeconds - 0.55));
    master.gain.linearRampToValueAtTime(0.0001, durationSeconds);
  }
  compressor.threshold.value = -18;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.22;
  master.connect(compressor);
  compressor.connect(context.destination);

  const beat = theme === "game-show" ? 60 / 140 : theme === "detective-case" ? 60 / 112 : theme === "sitcom-intro" ? 60 / 132 : 60 / 108;
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

  if (theme !== "game-show" && theme !== "detective-case" && theme !== "sitcom-intro") {
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
  if (theme !== "game-show" && theme !== "detective-case" && theme !== "sitcom-intro") {
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
  }


  if (theme === "family-merienda") {
    // Soft packet rustle, cookie slide, six-second countdown and a warm reveal chime.
    const rustleLength=Math.ceil(sampleRate*.18);
    const rustleBuffer=context.createBuffer(1,rustleLength,sampleRate);
    const rustleData=rustleBuffer.getChannelData(0);
    for(let i=0;i<rustleLength;i++) rustleData[i]=(random()*2-1)*Math.pow(1-i/rustleLength,1.8);
    for(const start of [3.55,3.82,4.08]){
      const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
      source.buffer=rustleBuffer;filter.type="bandpass";filter.frequency.value=2200;filter.Q.value=.55;
      gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(.055,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+.19);
      source.connect(filter);filter.connect(gain);gain.connect(master);source.start(start);
    }
    const slide=context.createOscillator(),slideGain=context.createGain(),slideFilter=context.createBiquadFilter();
    slide.type="sine";slide.frequency.setValueAtTime(420,4.05);slide.frequency.exponentialRampToValueAtTime(180,6.35);
    slideFilter.type="lowpass";slideFilter.frequency.value=900;
    slideGain.gain.setValueAtTime(.0001,4.02);slideGain.gain.linearRampToValueAtTime(.07,4.25);slideGain.gain.exponentialRampToValueAtTime(.0001,6.42);
    slide.connect(slideFilter);slideFilter.connect(slideGain);slideGain.connect(master);slide.start(4.02);slide.stop(6.45);
    for(let second=11;second<17;second++){
      const osc=context.createOscillator(),gain=context.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(second===16?880:660,second);
      gain.gain.setValueAtTime(.0001,second);gain.gain.linearRampToValueAtTime(.10,second+.012);gain.gain.exponentialRampToValueAtTime(.0001,second+.16);
      osc.connect(gain);gain.connect(master);osc.start(second);osc.stop(second+.18);
    }
    [17.05,18.0,19.0,20.0,21.0].forEach((start,index)=>{
      const osc=context.createOscillator(),gain=context.createGain();
      osc.type="sine";osc.frequency.setValueAtTime([523.25,659.25,783.99,987.77,1046.5][index],start);
      gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(.085,start+.02);gain.gain.exponentialRampToValueAtTime(.0001,start+.38);
      osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+.4);
    });
    // More tactile, clearly timed actions: foil tear, cookie whoosh, plate landing and CTA sparkle.
    const tearSource=context.createBufferSource(),tearFilter=context.createBiquadFilter(),tearGain=context.createGain();
    tearSource.buffer=rustleBuffer;tearFilter.type="bandpass";tearFilter.frequency.setValueAtTime(1500,3.48);tearFilter.frequency.linearRampToValueAtTime(3400,3.78);tearFilter.Q.value=.7;
    tearGain.gain.setValueAtTime(.0001,3.48);tearGain.gain.linearRampToValueAtTime(.11,3.55);tearGain.gain.exponentialRampToValueAtTime(.0001,3.92);
    tearSource.connect(tearFilter);tearFilter.connect(tearGain);tearGain.connect(master);tearSource.start(3.48);
    const whooshSource=context.createBufferSource(),whooshFilter=context.createBiquadFilter(),whooshGain=context.createGain();
    whooshSource.buffer=rustleBuffer;whooshSource.loop=true;whooshFilter.type="bandpass";whooshFilter.frequency.setValueAtTime(420,4.12);whooshFilter.frequency.exponentialRampToValueAtTime(5200,5.95);whooshFilter.Q.value=.42;
    whooshGain.gain.setValueAtTime(.0001,4.12);whooshGain.gain.linearRampToValueAtTime(.13,4.5);whooshGain.gain.exponentialRampToValueAtTime(.0001,6.12);
    whooshSource.connect(whooshFilter);whooshFilter.connect(whooshGain);whooshGain.connect(master);whooshSource.start(4.12);whooshSource.stop(6.14);
    addTone(115,6.18,.24,"sine",.22,360,0);
    addTone(1_480,6.20,.12,"triangle",.055,5_200,.22);
    addTone(1_760,17.02,.22,"sine",.07,5_800,-.2);
    addTone(2_090,17.18,.28,"sine",.06,6_200,.2);
    addTone(880,22.05,.35,"triangle",.065,5_000,-.18);
    addTone(1_320,22.22,.42,"sine",.055,6_000,.18);
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
    // Soft continuous pour body: filtered noise with gentle level automation.
    const pourLength = Math.ceil(sampleRate * 0.32);
    const pourBuffer = context.createBuffer(1, pourLength, sampleRate);
    const pourData = pourBuffer.getChannelData(0);
    for (let i = 0; i < pourLength; i += 1) {
      const t = i / pourLength;
      const breath = 0.72 + 0.28 * Math.sin(t * Math.PI);
      pourData[i] = (random() * 2 - 1) * breath;
    }
    const pourSource = context.createBufferSource();
    const pourFilter = context.createBiquadFilter();
    const pourGain = context.createGain();
    pourSource.buffer = pourBuffer;
    pourSource.loop = true;
    pourFilter.type = "bandpass";
    pourFilter.frequency.value = 920;
    pourFilter.Q.value = 0.48;
    pourGain.gain.setValueAtTime(0.0001, 3.88);
    pourGain.gain.linearRampToValueAtTime(0.012, 4.18);
    pourGain.gain.setValueAtTime(0.010, 5.75);
    pourGain.gain.exponentialRampToValueAtTime(0.0001, 6.48);
    pourSource.connect(pourFilter);
    pourFilter.connect(pourGain);
    pourGain.connect(master);
    pourSource.start(3.88);
    pourSource.stop(6.52);

    // Fine carbonation hiss over the pour, deliberately quieter than the liquid body.
    for (let start = 3.94; start < 6.42; start += 0.28) {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = fizzBuffer;
      filter.type = "bandpass";
      filter.frequency.value = 4_800 + random() * 1_700;
      filter.Q.value = 0.62;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.007, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSeconds, start + 0.24));
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(start);
    }
    // Tiny glass/ice ticks, not bright electronic chimes.
    addTone(1_320, 3.98, 0.11, "sine", 0.022, 5_000, -0.24);
    addTone(1_760, 4.08, 0.10, "sine", 0.018, 5_500, 0.24);
    addTone(1_120, 5.92, 0.12, "triangle", 0.016, 4_800, 0.18);
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

  if (theme === "sitcom-intro") {
    // Original four-second comedy-sitcom sting: bright plucked mallets,
    // springy bass, offbeat chord pops and a soft brushed/clap backbeat.
    // It is composed entirely from oscillators and deterministic filtered noise.
    const bpm = 132;
    const q = 60 / bpm;
    const hook = [
      659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 523.25, 587.33,
      698.46, 783.99, 987.77, 880.00, 783.99, 698.46, 659.25, 523.25,
      659.25, 698.46, 783.99, 1_046.50,
    ];
    for (let i = 0; i < hook.length; i += 1) {
      const at = i * q * 0.5;
      addTone(hook[i], at, 0.17, "triangle", i % 4 === 0 ? 0.18 : 0.125,
        4_200, i % 2 === 0 ? -0.22 : 0.22);
      if (i % 4 === 2) addTone(hook[i] * 0.5, at + 0.025, 0.16, "sine", 0.055, 1_500, 0);
    }
    const bassNotes = [130.81, 130.81, 110.00, 110.00, 87.31, 87.31, 98.00, 98.00,
      130.81, 130.81, 110.00, 110.00, 146.83, 146.83, 130.81, 130.81,
      98.00, 98.00, 130.81, 130.81];
    bassNotes.forEach((hz, i) => {
      const at = i * q * 0.5;
      addTone(hz, at, 0.23, "triangle", 0.20, 420, 0);
      if (i % 2 === 0) addTone(hz * 2, at + 0.035, 0.13, "sine", 0.07, 900, 0);
    });
    const hitLength = Math.ceil(sampleRate * 0.11);
    const hitBuffer = context.createBuffer(1, hitLength, sampleRate);
    const hitData = hitBuffer.getChannelData(0);
    for (let i = 0; i < hitLength; i += 1) {
      hitData[i] = (random() * 2 - 1) * Math.exp(-(i / sampleRate) * 38);
    }
    for (let beatIndex = 0, at = 0; at < 4.70; beatIndex += 1, at += q) {
      // Small soft kick on each quarter note.
      addTone(beatIndex % 2 === 0 ? 72 : 86, at, 0.12, "sine", 0.11, 180, 0);
      // Brushed snare/clap on beats two and four, intentionally light and comic.
      if (beatIndex % 2 === 1) {
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        source.buffer = hitBuffer;
        filter.type = "bandpass"; filter.frequency.value = 1_650; filter.Q.value = 0.72;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.linearRampToValueAtTime(0.055, at + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.11);
        source.connect(filter); filter.connect(gain); gain.connect(master); source.start(at);
      }
      // Gentle shaker taps keep the pulse lively without sounding electronic.
      for (const sub of [0.5]) {
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        source.buffer = hitBuffer;
        filter.type = "highpass"; filter.frequency.value = 5_800;
        gain.gain.setValueAtTime(0.0001, at + sub * q);
        gain.gain.linearRampToValueAtTime(0.014, at + sub * q + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + sub * q + 0.06);
        source.connect(filter); filter.connect(gain); gain.connect(master); source.start(at + sub * q);
      }
    }
    // A tiny rising two-note tag makes the sting land like the start of a sitcom.
    addTone(783.99, 4.18, 0.26, "triangle", 0.15, 4_000, -0.12);
    addTone(1_046.50, 4.43, 0.50, "triangle", 0.18, 4_800, 0.16);

    // Reprise the series hook over the closing credits, with a warm resolved chord.
    const outroAt = Math.max(5.8, durationSeconds - 7.85);
    const outroHook = [659.25, 783.99, 880.00, 783.99, 698.46, 783.99, 1_046.50, 987.77,
      880.00, 783.99, 659.25, 587.33, 698.46, 783.99, 880.00, 1_046.50];
    outroHook.forEach((hz, i) => {
      const at = outroAt + i * q * 0.48;
      addTone(hz, at, 0.24, "triangle", i % 4 === 3 ? 0.16 : 0.12,
        4_600, i % 2 ? 0.20 : -0.20);
      if (i % 4 === 0) addTone(hz * 0.5, at + 0.025, 0.20, "sine", 0.052, 1_700, 0);
    });
    const outroChordAt = Math.max(outroAt + 3.8, durationSeconds - 2.2);
    [261.63, 329.63, 392.00, 523.25].forEach((hz, i) =>
      addTone(hz, outroChordAt + i * 0.035, Math.max(0.35, durationSeconds - outroChordAt - 0.08),
        "triangle", 0.095, 3_600, (i - 1.5) * 0.22),
    );
  }

  if (theme === "game-show") {
    // A completely new high-energy live quiz-show composition: funky brass, syncopated bass,
    // punchy drums and a memorable call-and-response synth riff. No applause or crowd effects.
    const bpm = 140;
    const q = 60 / bpm;
    const barLength = q * 4;
    const roots = [73.42, 65.41, 87.31, 82.41]; // D, C, F, E
    const chordSets = [
      [293.66, 349.23, 440.00], // Dm
      [261.63, 329.63, 392.00], // C
      [349.23, 440.00, 523.25], // F
      [329.63, 392.00, 493.88], // Em
    ];

    // A bold opening hit, then an ascending broadcast-style brass fanfare.
    [146.83, 220.00, 293.66, 349.23, 440.00, 587.33].forEach((hz, i) => {
      addTone(hz, 0.08 + i * 0.065, 0.48, "sawtooth", 0.105, 2_600 + i * 280, (i - 2.5) * 0.15);
      addTone(hz * 2, 0.08 + i * 0.065, 0.30, "square", 0.025, 3_600, (2.5 - i) * 0.12);
    });

    // Funky bass line: syncopated, octave-jumping and deliberately unlike the previous tune.
    for (let barIndex = 0, at = 0; at < durationSeconds; barIndex += 1, at += barLength) {
      const root = roots[barIndex % roots.length];
      const pattern = [
        [0, 1], [0.75, 2], [1.5, 1], [2.0, 1.5], [2.75, 2], [3.5, 1],
      ];
      for (const [beatOffset] of pattern) {
        const t = at + beatOffset * q;
        addTone(root, t, q * 0.30, "square", 0.16, 620, -0.08);
        addTone(root * 2, t + 0.012, q * 0.24, "sawtooth", 0.055, 1_250, 0.08);
      }

      // Short brass chord punches on offbeats, with alternating stereo placement.
      const chord = chordSets[barIndex % chordSets.length];
      [0.5, 1.75, 2.5, 3.25].forEach((offset, hit) => {
        chord.forEach((hz, note) =>
          addTone(hz * (hit === 2 ? 2 : 1), at + offset * q, 0.19, "sawtooth",
            hit === 2 ? 0.052 : 0.072, 2_900, (note - 1) * 0.32 + (hit % 2 ? 0.12 : -0.12)),
        );
      });
    }

    // Driving four-on-the-floor kick, crisp snare on 2/4 and busy closed hats.
    const drumNoiseLength = Math.ceil(sampleRate * 0.12);
    const drumNoise = context.createBuffer(1, drumNoiseLength, sampleRate);
    const drumData = drumNoise.getChannelData(0);
    for (let i = 0; i < drumNoiseLength; i += 1) {
      drumData[i] = (random() * 2 - 1) * Math.exp(-(i / sampleRate) * 34);
    }
    for (let beatIndex = 0, at = 0; at < durationSeconds; beatIndex += 1, at += q) {
      addTone(beatIndex % 4 === 0 ? 58 : 68, at, 0.22, "sine", 0.24, 170, 0);
      if (beatIndex % 4 === 1 || beatIndex % 4 === 3) {
        const snare = context.createBufferSource();
        const snareFilter = context.createBiquadFilter();
        const snareGain = context.createGain();
        snare.buffer = drumNoise;
        snareFilter.type = "highpass";
        snareFilter.frequency.value = 1_100;
        snareGain.gain.setValueAtTime(0.0001, at);
        snareGain.gain.linearRampToValueAtTime(0.115, at + 0.004);
        snareGain.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSeconds, at + 0.12));
        snare.connect(snareFilter); snareFilter.connect(snareGain); snareGain.connect(master);
        snare.start(at);
      }
      for (const sub of [0, 0.5]) {
        const hat = context.createBufferSource();
        const hatFilter = context.createBiquadFilter();
        const hatGain = context.createGain();
        hat.buffer = drumNoise;
        hatFilter.type = "highpass";
        hatFilter.frequency.value = 6_200;
        const hitAt = at + sub * q;
        hatGain.gain.setValueAtTime(0.0001, hitAt);
        hatGain.gain.linearRampToValueAtTime(sub === 0 ? 0.027 : 0.018, hitAt + 0.002);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSeconds, hitAt + 0.045));
        hat.connect(hatFilter); hatFilter.connect(hatGain); hatGain.connect(master);
        hat.start(hitAt);
      }
    }

    // Signature call-and-response melody: a short brass hook answered by a bright synth.
    const hook = [587.33, 698.46, 783.99, 698.46, 587.33, 523.25, 440.00, 523.25,
      587.33, 783.99, 880.00, 783.99, 698.46, 587.33, 523.25, 440.00];
    for (let i = 0, at = 2.8; at < durationSeconds; i += 1, at += q * 0.5) {
      const hz = hook[i % hook.length];
      const accent = i % 8 === 0;
      addTone(hz, at, accent ? 0.24 : 0.15, accent ? "sawtooth" : "square",
        accent ? 0.095 : 0.052, accent ? 3_400 : 4_200, i % 2 ? 0.28 : -0.28);
      if (i % 4 === 2) addTone(hz * 0.5, at + 0.025, 0.18, "triangle", 0.045, 1_800, 0);
    }

    // Six countdown ticks remain clear above the new instrumental.
    for (let second = 10; second < 16; second += 1) {
      addTone(second === 15 ? 1_480 : 1_050, second, 0.075, "square",
        second === 15 ? 0.075 : 0.048, 5_000, 0);
      addTone(82.41, second, 0.10, "sine", 0.085, 260, 0);
    }

    // A new rising reveal sting and a short branded CTA finish. No clapping.
    [587.33, 698.46, 880.00, 1_046.5].forEach((hz, i) =>
      addTone(hz, 16.05 + i * 0.075, 0.48, "sawtooth", 0.085, 4_400, (i - 1.5) * 0.2),
    );
    [293.66, 369.99, 440.00].forEach((hz, i) =>
      addTone(hz, 25.05 + i * 0.09, 0.42, "square", 0.065, 3_600, (i - 1) * 0.25),
    );
  }


  if (theme === "detective-case") {
    // Freshly composed noir suspense score: low strings, dissonant sustained harmony,
    // a restrained piano ostinato and cinematic impacts. No clock ticks or crowd sounds.
    const bpm = 82;
    const q = 60 / bpm;
    const barLength = q * 4;
    const roots = [73.42, 58.27, 65.41, 55.00]; // D, Bb, C, A
    const chords = [
      [146.83, 174.61, 220.00, 261.63], // Dm add9
      [116.54, 146.83, 174.61, 220.00], // Bb maj7 colour
      [130.81, 155.56, 196.00, 233.08], // Cm tension
      [110.00, 130.81, 164.81, 207.65], // A7 suspension
    ];

    const addStringPad = (frequency: number, start: number, length: number, pan: number, peak: number) => {
      if (start >= durationSeconds || length <= 0) return;
      const end = Math.min(durationSeconds, start + length);
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const envelope = context.createGain();
      const panner = context.createStereoPanner();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.detune.setValueAtTime(-4, start);
      filter.type = "lowpass"; filter.frequency.setValueAtTime(980, start); filter.Q.value = 0.6;
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.linearRampToValueAtTime(peak, Math.min(end, start + 0.42));
      envelope.gain.setValueAtTime(peak, Math.max(start + 0.43, end - 0.38));
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      panner.pan.setValueAtTime(pan, start);
      oscillator.connect(filter); filter.connect(envelope); envelope.connect(panner); panner.connect(master);
      oscillator.start(start); oscillator.stop(end + 0.01);
    };

    // Slow, dark bowed-string harmony and a deep investigative drone.
    for (let barIndex = 0, at = 0; at < durationSeconds; barIndex += 1, at += barLength) {
      const root = roots[barIndex % roots.length];
      const chord = chords[barIndex % chords.length];
      addTone(root, at, barLength * 1.12, "sine", 0.085, 190, 0);
      addTone(root * 0.5, at + 0.015, barLength * 0.88, "triangle", 0.045, 120, 0);
      chord.forEach((hz, noteIndex) =>
        addStringPad(hz, at + (noteIndex === 3 ? 0.20 : 0), barLength * 0.96,
          (noteIndex - 1.5) * 0.30, noteIndex === 0 ? 0.024 : 0.017),
      );
      // A low, soft cinematic thud at the start of each measure.
      addTone(root * 0.75, at + 0.04, 0.32, "sine", 0.105, 150, 0);
      if (at + q * 2 < durationSeconds) addTone(root, at + q * 2, 0.18, "triangle", 0.035, 260, 0.04);
    }

    // A measured, slightly dissonant piano-like motif, leaving space for the narration.
    const ostinato = [293.66, 440.00, 311.13, 392.00, 293.66, 466.16, 349.23, 392.00];
    for (let barIndex = 0, at = 0.42; at < durationSeconds; barIndex += 1, at += barLength) {
      [0, 1.5, 2.5, 3.25].forEach((beatOffset, noteIndex) => {
        const t = at + beatOffset * q;
        const hz = ostinato[(barIndex * 2 + noteIndex) % ostinato.length];
        addTone(hz, t, 0.22, "triangle", noteIndex === 0 ? 0.050 : 0.034,
          2_200, noteIndex % 2 ? 0.24 : -0.24);
        if (noteIndex === 2) addTone(hz * 0.5, t + 0.035, 0.18, "sine", 0.025, 820, 0);
      });
    }

    // Muted high strings add a slow shiver above the harmony, never a ticking clock.
    for (let at = 1.15, index = 0; at < durationSeconds; at += barLength * 2, index += 1) {
      const hz = [587.33, 622.25, 523.25, 554.37][index % 4];
      addStringPad(hz, at, Math.min(barLength * 1.7, durationSeconds - at), index % 2 ? 0.28 : -0.28, 0.010);
    }

    // Deterministic filtered-noise swells: paper movement and a dramatic missing-list reveal.
    const swellLength = Math.ceil(sampleRate * 0.82);
    const swellBuffer = context.createBuffer(1, swellLength, sampleRate);
    const swellData = swellBuffer.getChannelData(0);
    for (let i = 0; i < swellLength; i += 1) {
      const fade = Math.sin((i / swellLength) * Math.PI);
      swellData[i] = (random() * 2 - 1) * fade;
    }
    for (const at of [7.38, 11.92, 15.98]) {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = swellBuffer;
      filter.type = "bandpass"; filter.frequency.setValueAtTime(520, at);
      filter.frequency.exponentialRampToValueAtTime(2_600, at + 0.58); filter.Q.value = 0.48;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.042, at + 0.34);
      gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSeconds, at + 0.82));
      source.connect(filter); filter.connect(gain); gain.connect(master); source.start(at);
    }

    // Unresolved low chord when the missing ingredients are revealed.
    addTone(73.42, 12.30, 0.92, "sine", 0.18, 220, 0);
    addTone(69.30, 12.42, 0.82, "triangle", 0.070, 420, 0.12);
    addTone(103.83, 12.48, 0.68, "sine", 0.052, 380, -0.12);

    // A restrained harmonic lift under the audience invitation, then a final detective sting.
    [349.23, 440.00, 523.25].forEach((hz, index) =>
      addTone(hz, 19.88 + index * 0.10, 0.70, "triangle", 0.060, 3_600, (index - 1) * 0.22),
    );
    [261.63, 329.63, 392.00].forEach((hz, index) =>
      addTone(hz, 27.15 + index * 0.12, 0.78, "sine", 0.066, 3_200, (index - 1) * 0.28),
    );
    addTone(1_760, 29.05, 0.24, "sine", 0.032, 5_600, 0.28);
    addTone(2_090, 29.20, 0.26, "sine", 0.028, 6_000, -0.28);
  }

  return context.startRendering();
}
