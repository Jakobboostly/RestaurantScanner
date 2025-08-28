import * as Tone from 'tone';

export class ToneManager {
  private static instance: ToneManager;
  private isInitialized = false;
  private isEnabled = true;
  private masterVolume: Tone.Volume;
  private synthesizers: Map<string, Tone.Synth | Tone.FMSynth | Tone.AMSynth> = new Map();
  private effects: Map<string, Tone.Effect> = new Map();
  
  // Revenue-based ambient parameters
  private ambientSynth: Tone.FMSynth;
  private ambientReverb: Tone.Reverb;
  private ambientDelay: Tone.FeedbackDelay;
  private ambientFilter: Tone.Filter;
  
  // Data sonification parameters
  private currentRevenue = 50000;
  private channelCount = 3;
  private growthRate = 0.02;

  private constructor() {
    this.masterVolume = new Tone.Volume(-10).toDestination();
    this.setupInstruments();
  }

  public static getInstance(): ToneManager {
    if (!ToneManager.instance) {
      ToneManager.instance = new ToneManager();
    }
    return ToneManager.instance;
  }

  private setupInstruments() {
    // Ambient atmosphere synth
    this.ambientSynth = new Tone.FMSynth({
      harmonicity: 0.5,
      modulationIndex: 2,
      envelope: {
        attack: 4,
        decay: 2,
        sustain: 0.8,
        release: 8
      }
    });
    
    // Ambient effects chain
    this.ambientReverb = new Tone.Reverb({
      decay: 8,
      wet: 0.4
    });
    
    this.ambientDelay = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.2,
      wet: 0.3
    });
    
    this.ambientFilter = new Tone.Filter({
      frequency: 800,
      type: "lowpass",
      rolloff: -12
    });
    
    // Connect ambient chain
    this.ambientSynth
      .connect(this.ambientFilter)
      .connect(this.ambientDelay)
      .connect(this.ambientReverb)
      .connect(this.masterVolume);
    
    // UI interaction synths
    this.synthesizers.set('leverToggle', new Tone.AMSynth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 }
    }).connect(this.masterVolume));
    
    this.synthesizers.set('success', new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 4,
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.8 }
    }).connect(this.masterVolume));
    
    this.synthesizers.set('error', new Tone.AMSynth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 0.4 }
    }).connect(this.masterVolume));
    
    this.synthesizers.set('keywordRank', new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 }
    }).connect(this.masterVolume));
    
    // Revenue milestone synth
    this.synthesizers.set('milestone', new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 1,
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1.2 }
    }).connect(this.masterVolume));
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await Tone.start();
      console.log('🎵 Audio context started');
      this.isInitialized = true;
      
      // Start ambient atmosphere
      this.startAmbientAtmosphere();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    } else if (this.isInitialized) {
      this.startAmbientAtmosphere();
    }
  }

  // Data-driven ambient atmosphere
  private startAmbientAtmosphere() {
    if (!this.isEnabled || !this.isInitialized) return;
    
    // Generate harmonic progression based on revenue metrics
    const baseFreq = 60 + (this.currentRevenue / 1000); // Revenue affects base frequency
    const harmony = this.generateHarmonicProgression(baseFreq);
    
    // Play ambient chord progression
    Tone.Transport.scheduleRepeat((time) => {
      if (!this.isEnabled) return;
      
      harmony.forEach((freq, index) => {
        this.ambientSynth.triggerAttackRelease(freq, "2n", time + index * 0.1, 0.1);
      });
      
      // Modulate filter based on channel diversity
      const filterFreq = 400 + (this.channelCount * 100) + (Math.random() * 200);
      this.ambientFilter.frequency.setValueAtTime(filterFreq, time);
      
    }, "4m"); // Every 4 measures
    
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }

  private generateHarmonicProgression(baseFreq: number): number[] {
    // Create harmonious chord based on revenue data
    const progression = [
      baseFreq,                    // Root
      baseFreq * 1.25,            // Perfect 4th
      baseFreq * 1.5,             // Perfect 5th  
      baseFreq * 2,               // Octave
    ];
    
    // Add complexity based on growth rate
    if (this.growthRate > 0.05) {
      progression.push(baseFreq * 1.33); // Perfect 4th up an octave
    }
    
    return progression;
  }

  // UI Sound Effects
  public playLeverToggle(leverId: string, isActive: boolean, revenueImpact: number) {
    if (!this.isEnabled || !this.isInitialized) return;
    
    const synth = this.synthesizers.get('leverToggle');
    if (!synth) return;
    
    // Pitch based on revenue impact
    const basePitch = isActive ? 'C4' : 'G3';
    const pitchOffset = Math.min(revenueImpact / 10000, 12); // Max 1 octave offset
    const finalPitch = Tone.Frequency(basePitch).transpose(pitchOffset);
    
    synth.triggerAttackRelease(finalPitch, '8n');
    
    // Add harmonic if high impact
    if (revenueImpact > 5000) {
      setTimeout(() => {
        synth.triggerAttackRelease(finalPitch.transpose(7), '16n', undefined, 0.3);
      }, 100);
    }
  }

  public playKeywordRankChange(currentRank: number, newRank: number, searchVolume: number) {
    if (!this.isEnabled || !this.isInitialized) return;
    
    const synth = this.synthesizers.get('keywordRank');
    if (!synth) return;
    
    // Higher pitch for better rankings
    const pitchMap = {
      1: 'C5', 2: 'A4', 3: 'F4', 4: 'D4', 5: 'C4',
      6: 'A3', 7: 'F3', 8: 'D3', 9: 'C3', 10: 'A2'
    };
    
    const currentPitch = pitchMap[Math.min(currentRank, 10) as keyof typeof pitchMap] || 'A2';
    const newPitch = pitchMap[Math.min(newRank, 10) as keyof typeof pitchMap] || 'A2';
    
    // Play transition
    synth.triggerAttackRelease(currentPitch, '16n');
    setTimeout(() => {
      synth.triggerAttackRelease(newPitch, '8n');
    }, 200);
    
    // Volume based on search volume
    const volume = Math.min(searchVolume / 5000, 1);
    synth.volume.setValueAtTime(Tone.gainToDb(volume * 0.3), Tone.now());
  }

  public playRevenueMilestone(milestoneAmount: number) {
    if (!this.isEnabled || !this.isInitialized) return;
    
    const synth = this.synthesizers.get('milestone');
    if (!synth) return;
    
    // Major chord progression for celebrations
    const chordProgression = ['C4', 'E4', 'G4', 'C5'];
    
    chordProgression.forEach((note, index) => {
      setTimeout(() => {
        synth.triggerAttackRelease(note, '4n', undefined, 0.6);
      }, index * 150);
    });
  }

  public playSuccessSound() {
    if (!this.isEnabled || !this.isInitialized) return;
    
    const synth = this.synthesizers.get('success');
    if (!synth) return;
    
    // Uplifting major seventh chord
    const chord = ['C4', 'E4', 'G4', 'B4'];
    chord.forEach((note, index) => {
      setTimeout(() => {
        synth.triggerAttackRelease(note, '4n', undefined, 0.4);
      }, index * 50);
    });
  }

  public playErrorSound() {
    if (!this.isEnabled || !this.isInitialized) return;
    
    const synth = this.synthesizers.get('error');
    if (!synth) return;
    
    // Diminished chord for negative feedback
    synth.triggerAttackRelease('F3', '8n');
    setTimeout(() => {
      synth.triggerAttackRelease('Ab3', '8n');
    }, 100);
  }

  // Data sonification - real-time audio representation of metrics
  public sonifyRevenueData(revenue: number, transactions: number, channels: any[]) {
    if (!this.isEnabled || !this.isInitialized) return;
    
    this.currentRevenue = revenue;
    this.channelCount = channels.length;
    
    // Tempo based on transaction volume
    const bpm = Math.max(60, Math.min(120, 60 + (transactions / 100)));
    Tone.Transport.bpm.setValueAtTime(bpm, Tone.now());
    
    // Modulate ambient parameters
    const revenueScale = revenue / 100000; // Normalize to 100k baseline
    
    // Filter cutoff represents growth potential
    const filterFreq = 400 + (revenueScale * 800);
    this.ambientFilter.frequency.exponentialRampToValueAtTime(filterFreq, Tone.now() + 2);
    
    // Reverb decay represents market reach
    const reverbDecay = Math.max(2, Math.min(10, channels.length * 2));
    this.ambientReverb.decay = reverbDecay;
  }

  public createInteractiveModeSequence() {
    if (!this.isEnabled || !this.isInitialized) return;
    
    // Clear existing patterns
    Tone.Transport.cancel();
    
    // Create rhythmic pattern for interactive exploration
    const pattern = new Tone.Pattern((time, note) => {
      if (!this.isEnabled) return;
      
      const synth = this.synthesizers.get('keywordRank');
      synth?.triggerAttackRelease(note, '16n', time, 0.1);
    }, ['C4', 'D4', 'E4', 'G4', 'A4'], 'randomOnce');
    
    pattern.start();
    Tone.Transport.start();
    
    return () => {
      pattern.dispose();
    };
  }

  public stopAllSounds() {
    // Stop transport
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    // Release all synths
    this.synthesizers.forEach(synth => {
      if ('releaseAll' in synth && typeof synth.releaseAll === 'function') {
        synth.releaseAll();
      }
    });
    
    this.ambientSynth.releaseAll();
  }

  public setMasterVolume(volume: number) {
    // Volume range: 0 to 1
    const dbValue = volume === 0 ? -Infinity : Tone.gainToDb(volume);
    this.masterVolume.volume.setValueAtTime(dbValue, Tone.now());
  }

  public dispose() {
    this.stopAllSounds();
    
    this.synthesizers.forEach(synth => synth.dispose());
    this.effects.forEach(effect => effect.dispose());
    
    this.ambientSynth.dispose();
    this.ambientReverb.dispose();
    this.ambientDelay.dispose();
    this.ambientFilter.dispose();
    this.masterVolume.dispose();
    
    this.isInitialized = false;
  }
}

// Convenience class for managing audio in React components
export class AudioReactManager {
  private toneManager: ToneManager;
  private cleanupFunctions: (() => void)[] = [];

  constructor() {
    this.toneManager = ToneManager.getInstance();
  }

  async initialize() {
    await this.toneManager.initialize();
  }

  // React-friendly event handlers
  onLeverToggle = (leverId: string, isActive: boolean, revenueImpact: number) => {
    this.toneManager.playLeverToggle(leverId, isActive, revenueImpact);
  };

  onKeywordRankChange = (currentRank: number, newRank: number, searchVolume: number) => {
    this.toneManager.playKeywordRankChange(currentRank, newRank, searchVolume);
  };

  onRevenueUpdate = (revenue: number, transactions: number, channels: any[]) => {
    this.toneManager.sonifyRevenueData(revenue, transactions, channels);
  };

  onSuccess = () => {
    this.toneManager.playSuccessSound();
  };

  onError = () => {
    this.toneManager.playErrorSound();
  };

  onMilestone = (amount: number) => {
    this.toneManager.playRevenueMilestone(amount);
  };

  setEnabled = (enabled: boolean) => {
    this.toneManager.setEnabled(enabled);
  };

  setVolume = (volume: number) => {
    this.toneManager.setMasterVolume(volume);
  };

  startInteractiveMode = () => {
    const cleanup = this.toneManager.createInteractiveModeSequence();
    if (cleanup) {
      this.cleanupFunctions.push(cleanup);
    }
  };

  cleanup = () => {
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
  };
}