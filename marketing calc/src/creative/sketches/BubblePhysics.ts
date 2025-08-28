import p5 from 'p5';

export interface BubbleData {
  stat: string;
  fact: string;
  title: string;
  details: string;
  source: string;
}

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  data: BubbleData;
  color: p5.Color;
  pulsePhase: number;
  isHovered: boolean;
  isExpanded: boolean;
  mass: number;
  springiness: number;
  friction: number;
}

export class BubblePhysicsSketch {
  private bubbles: Bubble[] = [];
  private mouseAttraction = 0.0001;
  private bubbleRepulsion = 0.5;
  private globalGravity = 0.02;
  private p: p5;
  private selectedBubble: Bubble | null = null;
  private particleSystem: Particle[] = [];
  private revenueMultiplier = 1;
  private onBubbleClick?: (data: BubbleData) => void;

  constructor(
    private containerElement: HTMLElement,
    private bubbleData: BubbleData[],
    private revenue?: number
  ) {
    // Create p5 instance
    const sketch = (p: p5) => {
      this.p = p;
      
      p.setup = () => {
        const canvas = p.createCanvas(
          this.containerElement.offsetWidth,
          this.containerElement.offsetHeight
        );
        canvas.parent(this.containerElement);
        
        // Initialize bubbles with physics properties
        this.initializeBubbles();
        
        // Create ambient particles
        this.initializeParticles();
      };

      p.draw = () => {
        // Gradient background
        this.drawGradientBackground();
        
        // Update and draw particles
        this.updateParticles();
        
        // Physics update
        this.updatePhysics();
        
        // Draw bubbles
        this.drawBubbles();
        
        // Draw connections between nearby bubbles
        this.drawConnections();
        
        // Handle expanded bubble overlay
        if (this.selectedBubble) {
          this.drawExpandedBubble(this.selectedBubble);
        }
      };

      p.mousePressed = () => {
        const mousePos = p.createVector(p.mouseX, p.mouseY);
        
        for (const bubble of this.bubbles) {
          const dist = p5.Vector.dist(mousePos, p.createVector(bubble.x, bubble.y));
          if (dist < bubble.radius) {
            if (this.selectedBubble === bubble) {
              this.selectedBubble = null;
              bubble.isExpanded = false;
            } else {
              if (this.selectedBubble) {
                this.selectedBubble.isExpanded = false;
              }
              this.selectedBubble = bubble;
              bubble.isExpanded = true;
              this.createExplosionEffect(bubble.x, bubble.y);
              
              if (this.onBubbleClick) {
                this.onBubbleClick(bubble.data);
              }
            }
            break;
          }
        }
      };

      p.mouseMoved = () => {
        const mousePos = p.createVector(p.mouseX, p.mouseY);
        
        for (const bubble of this.bubbles) {
          const dist = p5.Vector.dist(mousePos, p.createVector(bubble.x, bubble.y));
          bubble.isHovered = dist < bubble.radius;
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(
          this.containerElement.offsetWidth,
          this.containerElement.offsetHeight
        );
      };
    };

    new p5(sketch);
  }

  private initializeBubbles() {
    const p = this.p;
    const colors = [
      p.color(255, 107, 107, 180),  // Red
      p.color(78, 205, 196, 180),   // Teal
      p.color(167, 139, 250, 180),  // Purple
      p.color(251, 191, 36, 180),   // Yellow
      p.color(244, 114, 182, 180),  // Pink
      p.color(16, 185, 129, 180),   // Green
      p.color(59, 130, 246, 180),   // Blue
      p.color(139, 92, 246, 180),   // Violet
    ];

    this.bubbleData.forEach((data, i) => {
      const radius = p.random(40, 80);
      this.bubbles.push({
        x: p.random(radius, p.width - radius),
        y: p.random(radius, p.height - radius),
        vx: p.random(-1, 1),
        vy: p.random(-1, 1),
        radius: radius,
        targetRadius: radius,
        data: data,
        color: colors[i % colors.length],
        pulsePhase: p.random(p.TWO_PI),
        isHovered: false,
        isExpanded: false,
        mass: radius * 0.1,
        springiness: 0.05,
        friction: 0.98
      });
    });
  }

  private initializeParticles() {
    const p = this.p;
    for (let i = 0; i < 50; i++) {
      this.particleSystem.push({
        x: p.random(p.width),
        y: p.random(p.height),
        vx: p.random(-0.5, 0.5),
        vy: p.random(-0.5, 0.5),
        size: p.random(2, 4),
        alpha: p.random(20, 60),
        lifespan: 1
      });
    }
  }

  private updatePhysics() {
    const p = this.p;
    const mousePos = p.createVector(p.mouseX, p.mouseY);
    
    for (let i = 0; i < this.bubbles.length; i++) {
      const bubble = this.bubbles[i];
      
      // Mouse attraction when hovered
      if (bubble.isHovered && !bubble.isExpanded) {
        const mouseForce = p5.Vector.sub(mousePos, p.createVector(bubble.x, bubble.y));
        mouseForce.mult(this.mouseAttraction);
        bubble.vx += mouseForce.x;
        bubble.vy += mouseForce.y;
      }
      
      // Bubble-to-bubble repulsion
      for (let j = i + 1; j < this.bubbles.length; j++) {
        const other = this.bubbles[j];
        const dist = p.dist(bubble.x, bubble.y, other.x, other.y);
        const minDist = bubble.radius + other.radius;
        
        if (dist < minDist && dist > 0) {
          const force = p5.Vector.sub(
            p.createVector(bubble.x, bubble.y),
            p.createVector(other.x, other.y)
          );
          force.normalize();
          force.mult((minDist - dist) * this.bubbleRepulsion);
          
          bubble.vx += force.x / bubble.mass;
          bubble.vy += force.y / bubble.mass;
          other.vx -= force.x / other.mass;
          other.vy -= force.y / other.mass;
        }
      }
      
      // Floating effect
      bubble.vy -= this.globalGravity;
      
      // Apply friction
      bubble.vx *= bubble.friction;
      bubble.vy *= bubble.friction;
      
      // Update position
      bubble.x += bubble.vx;
      bubble.y += bubble.vy;
      
      // Boundary collision with bounce
      if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > p.width) {
        bubble.vx *= -0.8;
        bubble.x = p.constrain(bubble.x, bubble.radius, p.width - bubble.radius);
      }
      if (bubble.y - bubble.radius < 0 || bubble.y + bubble.radius > p.height) {
        bubble.vy *= -0.8;
        bubble.y = p.constrain(bubble.y, bubble.radius, p.height - bubble.radius);
      }
      
      // Pulse animation
      bubble.pulsePhase += 0.02;
      const pulseFactor = 1 + p.sin(bubble.pulsePhase) * 0.05;
      
      // Smooth radius transitions
      if (bubble.isHovered && !bubble.isExpanded) {
        bubble.targetRadius = bubble.radius * 1.1;
      } else if (bubble.isExpanded) {
        bubble.targetRadius = bubble.radius * 1.3;
      } else {
        bubble.targetRadius = bubble.radius * pulseFactor;
      }
      
      // Spring-based radius animation
      const radiusDiff = bubble.targetRadius - bubble.radius;
      bubble.radius += radiusDiff * bubble.springiness;
    }
  }

  private drawGradientBackground() {
    const p = this.p;
    // Create vertical gradient
    for (let i = 0; i <= p.height; i++) {
      const inter = p.map(i, 0, p.height, 0, 1);
      const c = p.lerpColor(
        p.color(139, 156, 244, 10),
        p.color(169, 127, 196, 10),
        inter
      );
      p.stroke(c);
      p.line(0, i, p.width, i);
    }
  }

  private drawBubbles() {
    const p = this.p;
    
    for (const bubble of this.bubbles) {
      if (bubble.isExpanded) continue; // Skip expanded bubble, drawn separately
      
      p.push();
      p.translate(bubble.x, bubble.y);
      
      // Outer glow
      if (bubble.isHovered) {
        p.noStroke();
        for (let i = 3; i > 0; i--) {
          const alpha = 20 / i;
          p.fill(p.red(bubble.color), p.green(bubble.color), p.blue(bubble.color), alpha);
          p.ellipse(0, 0, bubble.radius * 2 * (1 + i * 0.1));
        }
      }
      
      // Main bubble
      p.fill(bubble.color);
      p.strokeWeight(2);
      p.stroke(255, 100);
      p.ellipse(0, 0, bubble.radius * 2);
      
      // Glass effect
      p.noStroke();
      p.fill(255, 30);
      p.arc(0, 0, bubble.radius * 2, bubble.radius * 2, -p.PI, 0);
      
      // Text content
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(bubble.radius * 0.5);
      p.textStyle(p.BOLD);
      p.text(bubble.data.stat, 0, -bubble.radius * 0.2);
      
      p.textSize(bubble.radius * 0.15);
      p.textStyle(p.NORMAL);
      const words = bubble.data.fact.split(' ');
      const lines = this.wrapText(words, 4);
      lines.forEach((line, i) => {
        p.text(line, 0, bubble.radius * 0.2 + i * bubble.radius * 0.2);
      });
      
      p.pop();
    }
  }

  private drawConnections() {
    const p = this.p;
    const maxDist = 150;
    
    for (let i = 0; i < this.bubbles.length; i++) {
      for (let j = i + 1; j < this.bubbles.length; j++) {
        const dist = p.dist(
          this.bubbles[i].x, this.bubbles[i].y,
          this.bubbles[j].x, this.bubbles[j].y
        );
        
        if (dist < maxDist) {
          const alpha = p.map(dist, 0, maxDist, 50, 0);
          p.stroke(255, alpha);
          p.strokeWeight(1);
          p.line(
            this.bubbles[i].x, this.bubbles[i].y,
            this.bubbles[j].x, this.bubbles[j].y
          );
        }
      }
    }
  }

  private drawExpandedBubble(bubble: Bubble) {
    const p = this.p;
    
    // Dark overlay
    p.fill(0, 150);
    p.rect(0, 0, p.width, p.height);
    
    // Expanded bubble card
    const cardWidth = p.min(500, p.width * 0.9);
    const cardHeight = p.min(400, p.height * 0.8);
    const cardX = p.width / 2;
    const cardY = p.height / 2;
    
    p.push();
    p.translate(cardX, cardY);
    
    // Card shadow
    p.noStroke();
    for (let i = 5; i > 0; i--) {
      p.fill(0, 10);
      p.rect(-cardWidth/2 - i*2, -cardHeight/2 + i*2, cardWidth + i*4, cardHeight + i*4, 20);
    }
    
    // Card background
    p.fill(bubble.color);
    p.rect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
    
    // Content
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Stat
    p.textSize(60);
    p.textStyle(p.BOLD);
    p.text(bubble.data.stat, 0, -cardHeight * 0.3);
    
    // Title
    p.textSize(24);
    p.text(bubble.data.title, 0, -cardHeight * 0.15);
    
    // Details
    p.textSize(16);
    p.textStyle(p.NORMAL);
    const detailLines = this.wrapText(bubble.data.details.split(' '), 10);
    detailLines.forEach((line, i) => {
      p.text(line, 0, -cardHeight * 0.05 + i * 25);
    });
    
    // Source
    p.textSize(12);
    p.textStyle(p.ITALIC);
    p.text(`Source: ${bubble.data.source}`, 0, cardHeight * 0.35);
    
    // Close hint
    p.fill(255, 200);
    p.textSize(14);
    p.textStyle(p.NORMAL);
    p.text('Click to close', 0, cardHeight * 0.42);
    
    p.pop();
  }

  private updateParticles() {
    const p = this.p;
    
    this.particleSystem = this.particleSystem.filter(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = p.width;
      if (particle.x > p.width) particle.x = 0;
      if (particle.y < 0) particle.y = p.height;
      if (particle.y > p.height) particle.y = 0;
      
      // Draw particle
      p.noStroke();
      p.fill(255, particle.alpha * particle.lifespan);
      p.ellipse(particle.x, particle.y, particle.size);
      
      // Fade out
      particle.lifespan *= 0.995;
      
      return particle.lifespan > 0.01;
    });
    
    // Replenish particles
    while (this.particleSystem.length < 50) {
      this.particleSystem.push({
        x: p.random(p.width),
        y: p.random(p.height),
        vx: p.random(-0.5, 0.5),
        vy: p.random(-0.5, 0.5),
        size: p.random(2, 4),
        alpha: p.random(20, 60),
        lifespan: 1
      });
    }
  }

  private createExplosionEffect(x: number, y: number) {
    const p = this.p;
    for (let i = 0; i < 20; i++) {
      const angle = p.random(p.TWO_PI);
      const speed = p.random(2, 5);
      this.particleSystem.push({
        x: x,
        y: y,
        vx: p.cos(angle) * speed,
        vy: p.sin(angle) * speed,
        size: p.random(3, 6),
        alpha: 100,
        lifespan: 1
      });
    }
  }

  private wrapText(words: string[], maxWordsPerLine: number): string[] {
    const lines: string[] = [];
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
    }
    return lines;
  }

  public updateRevenue(revenue: number) {
    this.revenueMultiplier = revenue / 50000; // Normalize to baseline
    // Adjust bubble physics based on revenue
    this.bubbles.forEach(bubble => {
      bubble.mass = bubble.radius * 0.1 * this.revenueMultiplier;
      bubble.springiness = 0.05 * (1 + this.revenueMultiplier * 0.5);
    });
  }

  public setBubbleClickHandler(handler: (data: BubbleData) => void) {
    this.onBubbleClick = handler;
  }

  public destroy() {
    this.p.remove();
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  lifespan: number;
}