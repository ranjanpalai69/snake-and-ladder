let ctx: AudioContext | null = null;

// iOS/Android require AudioContext to be resumed inside a user gesture.
// Call unlockAudio() on the first touchstart/click to unlock the context.
export function unlockAudio(): void {
  try {
    if (!ctx || ctx.state === "closed") ctx = new AudioContext();
    // Play a one-sample silent buffer — this is the only reliable iOS unlock
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    src.stop(0);
    ctx.resume().catch(() => {});
  } catch {}
}

function getCtx(): AudioContext {
  if (!ctx || ctx.state === "closed") ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function playDiceRoll() {
  try {
    const c = getCtx();
    const now = c.currentTime;
    for (let i = 0; i < 8; i++) {
      const delay = i * 0.045;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "square";
      osc.frequency.value = 150 + Math.random() * 250;
      gain.gain.setValueAtTime(0.08, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.04);
    }
  } catch {}
}

export function playStep() {
  try {
    const c = getCtx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.07);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch {}
}

export function playSnakeBite() {
  try {
    const c = getCtx();
    const now = c.currentTime;
    const bufLen = Math.floor(c.sampleRate * 0.6);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3000;
    filter.Q.value = 3;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(now);

    const osc = c.createOscillator();
    const g2 = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
    g2.gain.setValueAtTime(0.12, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(g2);
    g2.connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch {}
}

export function playLadderClimb() {
  try {
    const c = getCtx();
    const now = c.currentTime;
    const notes = [523, 659, 784, 880, 1047];
    notes.forEach((freq, i) => {
      const t = now + i * 0.13;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  } catch {}
}

export function playRemindReady() {
  try {
    const c = getCtx();
    const now = c.currentTime;
    const notes = [880, 1047, 1319];
    notes.forEach((freq, i) => {
      const t = now + i * 0.16;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  } catch {}
}

export function playWin() {
  try {
    const c = getCtx();
    const now = c.currentTime;
    const melody = [523, 523, 523, 659, 523, 659, 784];
    const durs =   [0.12, 0.12, 0.12, 0.18, 0.12, 0.18, 0.4];
    let t = now;
    melody.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durs[i]);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + durs[i]);
      t += durs[i] + 0.02;
    });
  } catch {}
}
