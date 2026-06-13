// Web Audio API Synthesizer for UI SFX and Ambient Drone
// This avoids the need for external MP3 files and provides a perfectly seamless,
// mathematically precise audio experience fitting the "Stealth" laboratory theme.

class AudioManager {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  public initialized = false;
  private isMuted = false;

  public init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.value = muted ? 0 : 1;
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, now);
      
      if (muted && this.ctx.state === "running") {
        this.ctx.suspend();
      } else if (!muted && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
  }

  public playHover() {
    // BUG-02 FIX: guard muted + ctx at the very top before any node creation
    if (!this.ctx || this.isMuted) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === "suspended") this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    // Quick pitch drop for a "blip" sound
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);

    filter.type = "lowpass";
    filter.frequency.value = 2000;

    // Short envelope
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);

    // BUG-01 FIX: disconnect all nodes after playback to prevent memory leak
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  public playClick() {
    // BUG-02 FIX: guard muted + ctx at the very top before any node creation
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);

    // BUG-01 FIX: disconnect all nodes after playback to prevent memory leak
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  public startAmbient() {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (this.ambientOscillators.length > 0) return; // Already playing

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    // Slow fade in over 5 seconds
    this.ambientGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 5);
    this.ambientGain.connect(this.masterGain!);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400; // Deep muffled sound

    // Create StereoPanner for 3D "spinning" ambient effect
    const panner = this.ctx.createStereoPanner();
    filter.connect(panner);
    panner.connect(this.ambientGain);

    // Slow LFO to pan the ambient drone left and right
    const panLfo = this.ctx.createOscillator();
    panLfo.type = "sine";
    panLfo.frequency.value = 0.03; // ~33 second full cycle (very slow orbit)
    panLfo.connect(panner.pan);
    panLfo.start();
    this.ambientOscillators.push(panLfo);

    // Create a slow LFO to sweep the filter for a breathing/pulsing effect
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05; // One cycle every 20 seconds
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200; // Sweep by 200Hz
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Create a chord of low drones (e.g. A1, E2, A2)
    const freqs = [55.00, 82.41, 110.00];
    
    freqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sawtooth";
      // Slight detune for thickness
      osc.frequency.value = freq + (Math.random() * 0.5 - 0.25);
      osc.connect(filter);
      osc.start();
      this.ambientOscillators.push(osc);
    });
    this.ambientOscillators.push(lfo); // keep track to stop later
  }

  public stopAmbient() {
    if (!this.ctx || !this.ambientGain) return;
    
    // Fade out over 2 seconds
    this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);

    setTimeout(() => {
      this.ambientOscillators.forEach(osc => osc.stop());
      this.ambientOscillators = [];
      this.ambientGain?.disconnect();
      this.ambientGain = null;
    }, 2000);
  }
}

// Export a singleton instance
export const audioManager = new AudioManager();
