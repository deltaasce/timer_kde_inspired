import { SoundType } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes sound using the native Web Audio API (AudioContext)
 */
export function playAlertSound(type: SoundType = 'apple-chime', masterVolume: number = 0.8) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, now);
    masterGain.connect(ctx.destination);

    if (type === 'apple-chime') {
      // Warm 4-note ascending marimba/bell sequence: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.5)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const noteTime = now + index * 0.12;

        // Primary fundamental oscillator
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        // Harmonic overtone for chime richness
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, noteTime);

        // Envelopes
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.4, noteTime + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.8);

        overtoneGain.gain.setValueAtTime(0, noteTime);
        overtoneGain.gain.linearRampToValueAtTime(0.12, noteTime + 0.01);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.4);

        osc.connect(noteGain);
        overtone.connect(overtoneGain);
        noteGain.connect(masterGain);
        overtoneGain.connect(masterGain);

        osc.start(noteTime);
        overtone.start(noteTime);
        osc.stop(noteTime + 0.85);
        overtone.stop(noteTime + 0.85);
      });
    } else if (type === 'zen-bell') {
      // Resonant singing bell with warm harmonics
      const baseFreq = 440; // A4
      const partials = [1, 2.01, 3.02, 4.2];
      const gains = [0.45, 0.22, 0.1, 0.04];

      partials.forEach((multiplier, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * multiplier, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gains[i], now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 2.2);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 2.25);
      });
    } else if (type === 'radar') {
      // Modern electronic double radar ping
      [0, 0.18].forEach((offset) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1760, t + 0.08);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } else if (type === 'crystal') {
      // Crystal glass ping
      const freq = 1318.51; // E6
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 1.25);
    }
  } catch (err) {
    console.error('Audio playback error:', err);
  }
}
