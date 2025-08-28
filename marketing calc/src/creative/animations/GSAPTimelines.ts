import { gsap } from 'gsap';

export class AnimationTimelines {
  
  // Enhanced lever toggle animation with ripple effects
  static createLeverToggleAnimation(
    leverElement: HTMLElement, 
    targetElements: HTMLElement[],
    isActive: boolean
  ): gsap.core.Timeline {
    const tl = gsap.timeline();
    
    // Main lever animation with elastic bounce
    tl.to(leverElement, {
      y: isActive ? -20 : 20,
      rotation: isActive ? 360 : -360,
      scale: 1.1,
      duration: 0.6,
      ease: "elastic.out(1, 0.5)"
    });
    
    // Scale back to normal
    tl.to(leverElement, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    }, "-=0.2");
    
    // Ripple effect to connected elements
    targetElements.forEach((element, index) => {
      tl.to(element, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      }, `-=${0.4 - index * 0.1}`);
      
      // Color flash
      tl.to(element, {
        backgroundColor: isActive ? "#4CAF50" : "#f44336",
        duration: 0.1,
        ease: "none",
        yoyo: true,
        repeat: 1
      }, `-=0.6`);
    });
    
    return tl;
  }

  // Revenue number morphing with count-up effect
  static createNumberMorphAnimation(
    element: HTMLElement,
    from: number,
    to: number,
    duration: number = 1.5
  ): gsap.core.Timeline {
    const tl = gsap.timeline();
    const numberObj = { value: from };
    
    // Scale emphasis
    tl.to(element, {
      scale: 1.2,
      duration: 0.2,
      ease: "power2.out"
    });
    
    // Count animation
    tl.to(numberObj, {
      value: to,
      duration: duration,
      ease: "power2.out",
      onUpdate: () => {
        element.textContent = `$${Math.round(numberObj.value).toLocaleString()}`;
      }
    }, "-=0.1");
    
    // Scale back
    tl.to(element, {
      scale: 1,
      duration: 0.3,
      ease: "elastic.out(1, 0.3)"
    }, "-=0.5");
    
    return tl;
  }

  // Chart bar growth with organic easing
  static createBarGrowthAnimation(
    bars: HTMLElement[],
    targetHeights: number[],
    staggerDelay: number = 0.1
  ): gsap.core.Timeline {
    const tl = gsap.timeline();
    
    bars.forEach((bar, index) => {
      const targetHeight = targetHeights[index] || 0;
      
      // Start from bottom, grow upward
      tl.fromTo(bar, {
        height: 0,
        y: "100%"
      }, {
        height: `${targetHeight}%`,
        y: "0%",
        duration: 1.2,
        ease: "power3.out"
      }, index * staggerDelay);
      
      // Add subtle bounce at the end
      tl.to(bar, {
        scaleY: 1.05,
        duration: 0.2,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      }, `-=0.3`);
    });
    
    return tl;
  }

  // Liquid morphing transition between chart states
  static createLiquidMorphAnimation(
    container: HTMLElement,
    fromState: any,
    toState: any
  ): gsap.core.Timeline {
    const tl = gsap.timeline();
    
    // Create liquid blob effect
    const blob = document.createElement('div');
    blob.style.cssText = `
      position: absolute;
      width: 100px;
      height: 100px;
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      border-radius: 50px;
      filter: blur(20px);
      opacity: 0;
      pointer-events: none;
    `;
    container.appendChild(blob);
    
    // Animate blob across the transition
    tl.to(blob, {
      opacity: 0.6,
      scale: 3,
      duration: 0.5,
      ease: "power2.out"
    })
    .to(blob, {
      x: container.offsetWidth,
      rotation: 360,
      duration: 0.8,
      ease: "power2.inOut"
    }, "-=0.3")
    .to(blob, {
      opacity: 0,
      scale: 0.5,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        container.removeChild(blob);
      }
    }, "-=0.2");
    
    return tl;
  }

  // Heartbeat animation for seasonal traffic
  static createHeartbeatAnimation(
    element: HTMLElement,
    intensity: number = 1
  ): gsap.core.Timeline {
    const tl = gsap.timeline({ repeat: -1 });
    const scaleFactor = 1 + (intensity * 0.1);
    
    tl.to(element, {
      scale: scaleFactor,
      duration: 0.1,
      ease: "power2.out"
    })
    .to(element, {
      scale: 1,
      duration: 0.1,
      ease: "power2.in"
    })
    .to(element, {
      scale: scaleFactor * 0.9,
      duration: 0.1,
      ease: "power2.out"
    })
    .to(element, {
      scale: 1,
      duration: 0.1,
      ease: "power2.in"
    })
    .to({}, { duration: 0.8 }); // Pause between beats
    
    return tl;
  }

  // Particle explosion effect
  static createParticleExplosion(
    centerX: number,
    centerY: number,
    container: HTMLElement,
    particleCount: number = 20
  ): gsap.core.Timeline {
    const tl = gsap.timeline();
    const particles: HTMLElement[] = [];
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: #fff;
        border-radius: 50%;
        left: ${centerX}px;
        top: ${centerY}px;
        pointer-events: none;
      `;
      container.appendChild(particle);
      particles.push(particle);
    }
    
    // Animate particles outward
    particles.forEach((particle, index) => {
      const angle = (index / particleCount) * Math.PI * 2;
      const distance = 100 + Math.random() * 50;
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;
      
      tl.to(particle, {
        x: endX - centerX,
        y: endY - centerY,
        opacity: 0,
        scale: 0,
        duration: 1,
        ease: "power2.out"
      }, 0);
    });
    
    // Cleanup
    tl.call(() => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    });
    
    return tl;
  }

  // Cinematic reveal animation for the revenue dashboard
  static createRevenueRevealAnimation(
    elements: {
      title: HTMLElement;
      cards: HTMLElement[];
      charts: HTMLElement[];
      summary: HTMLElement;
    }
  ): gsap.core.Timeline {
    const tl = gsap.timeline();
    
    // Set initial states
    gsap.set([elements.title, ...elements.cards, ...elements.charts, elements.summary], {
      opacity: 0,
      y: 50
    });
    
    // Title entrance
    tl.to(elements.title, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    });
    
    // Cards staggered entrance
    tl.to(elements.cards, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.1
    }, "-=0.4");
    
    // Charts with scale effect
    elements.charts.forEach((chart, index) => {
      tl.fromTo(chart, {
        opacity: 0,
        scale: 0.8,
        rotationY: -45
      }, {
        opacity: 1,
        scale: 1,
        rotationY: 0,
        duration: 0.8,
        ease: "power3.out"
      }, `-=${0.6 - index * 0.2}`);
    });
    
    // Summary dramatic entrance
    tl.fromTo(elements.summary, {
      opacity: 0,
      scale: 0.9,
      rotationX: -20
    }, {
      opacity: 1,
      scale: 1,
      rotationX: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.3");
    
    return tl;
  }

  // Synchronized cascade animation for multiple charts
  static createCascadeAnimation(
    triggerElement: HTMLElement,
    targetElements: HTMLElement[],
    effect: 'ripple' | 'wave' | 'explosion' = 'ripple'
  ): gsap.core.Timeline {
    const tl = gsap.timeline();
    
    // Trigger flash
    tl.to(triggerElement, {
      backgroundColor: "#FFD700",
      duration: 0.1,
      ease: "none",
      yoyo: true,
      repeat: 1
    });
    
    switch (effect) {
      case 'ripple':
        targetElements.forEach((element, index) => {
          tl.to(element, {
            scale: 1.05,
            rotationY: 5,
            duration: 0.3,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
          }, `-=${0.8 - index * 0.1}`);
        });
        break;
        
      case 'wave':
        targetElements.forEach((element, index) => {
          tl.to(element, {
            y: -20,
            duration: 0.4,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
          }, `-=${0.6 - index * 0.05}`);
        });
        break;
        
      case 'explosion':
        targetElements.forEach((element, index) => {
          tl.fromTo(element, {
            scale: 1
          }, {
            scale: 1.1,
            rotation: (index % 2 === 0 ? 5 : -5),
            duration: 0.3,
            ease: "elastic.out(1, 0.5)",
            yoyo: true,
            repeat: 1
          }, `-=${0.5 - index * 0.05}`);
        });
        break;
    }
    
    return tl;
  }
}

// Utility functions for animation management
export class AnimationManager {
  private static activeAnimations: Map<string, gsap.core.Timeline> = new Map();
  
  static play(id: string, animation: gsap.core.Timeline) {
    // Kill existing animation with same ID
    if (this.activeAnimations.has(id)) {
      this.activeAnimations.get(id)?.kill();
    }
    
    // Store and play new animation
    this.activeAnimations.set(id, animation);
    animation.play();
    
    // Clean up when complete
    animation.call(() => {
      this.activeAnimations.delete(id);
    });
  }
  
  static kill(id: string) {
    if (this.activeAnimations.has(id)) {
      this.activeAnimations.get(id)?.kill();
      this.activeAnimations.delete(id);
    }
  }
  
  static killAll() {
    this.activeAnimations.forEach(animation => animation.kill());
    this.activeAnimations.clear();
  }
  
  static isPlaying(id: string): boolean {
    return this.activeAnimations.has(id);
  }
}