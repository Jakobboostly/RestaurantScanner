// Simple audio feedback system that actually works reliably
export class SimpleAudio {
  private static instance: SimpleAudio;
  private audioContext: AudioContext | null = null;
  private isEnabled = false;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SimpleAudio {
    if (!SimpleAudio.instance) {
      SimpleAudio.instance = new SimpleAudio();
    }
    return SimpleAudio.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Only initialize on user interaction
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      this.isEnabled = true;
      console.log('🎵 Simple audio initialized');
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  private createBeep(frequency: number, duration: number, volume: number = 0.1): void {
    if (!this.audioContext || !this.isEnabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  // Simple, reliable sound effects
  public playSuccess(): void {
    this.createBeep(800, 0.2, 0.05);
    setTimeout(() => this.createBeep(1000, 0.2, 0.05), 100);
  }

  public playClick(): void {
    this.createBeep(600, 0.1, 0.03);
  }

  public playToggle(isOn: boolean): void {
    const frequency = isOn ? 880 : 440;
    this.createBeep(frequency, 0.15, 0.04);
  }

  public playHover(): void {
    this.createBeep(500, 0.05, 0.02);
  }

  public playError(): void {
    this.createBeep(300, 0.3, 0.05);
  }

  public playChime(): void {
    const notes = [523, 659, 784]; // C, E, G
    notes.forEach((freq, index) => {
      setTimeout(() => this.createBeep(freq, 0.3, 0.03), index * 100);
    });
  }
}

// React hook for easy audio integration
export const useSimpleAudio = () => {
  const audio = SimpleAudio.getInstance();

  const initializeAudio = () => {
    audio.initialize();
  };

  const playSuccess = () => audio.playSuccess();
  const playClick = () => audio.playClick();
  const playToggle = (isOn: boolean) => audio.playToggle(isOn);
  const playHover = () => audio.playHover();
  const playError = () => audio.playError();
  const playChime = () => audio.playChime();
  const setEnabled = (enabled: boolean) => audio.setEnabled(enabled);

  return {
    initializeAudio,
    playSuccess,
    playClick,
    playToggle,
    playHover,
    playError,
    playChime,
    setEnabled
  };
};