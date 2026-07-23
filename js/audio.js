/* ==========================================================================
   VAIGA - WEB AUDIO SYNTHESIZER
   Provides cozy ambient chords, slice swooshes, fruit squishes, and combo chimes.
   ========================================================================== */

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio API not supported", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playSliceSound() {
        if (!this.enabled || !this.initialized || !this.ctx) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;

            // Swoosh Noise generator
            const bufferSize = this.ctx.sampleRate * 0.12;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);
            filter.Q.value = 3.0;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
        } catch (e) {}
    }

    playSplatterSound() {
        if (!this.enabled || !this.initialized || !this.ctx) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(480, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    }

    playExplosionSound() {
        if (!this.enabled || !this.initialized || !this.ctx) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;

            // Low frequency rumble oscillator
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

            oscGain.gain.setValueAtTime(0.6, now);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc.connect(oscGain);
            oscGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);

            // Explosive white noise surge
            const bufferSize = this.ctx.sampleRate * 0.45;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(60, now + 0.45);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.7, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        } catch (e) {}
    }

    playComboSound(multiplier = 3) {
        if (!this.enabled || !this.initialized || !this.ctx) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;
            // Pentatonic scale frequency notes (C5, E5, G5, A5, C6)
            const pentatonic = [523.25, 659.25, 783.99, 880.00, 1046.50];
            const noteIndex = Math.min(multiplier - 2, pentatonic.length - 1);
            const freq = pentatonic[noteIndex] || 523.25;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.25);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) {}
    }
}
