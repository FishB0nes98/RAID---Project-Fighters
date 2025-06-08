/**
 * Healing Wind VFX Manager
 * Creates beautiful wind particle effects for the healing wind stage modifier
 */
class HealingWindVFX {
    constructor() {
        this.container = null;
        this.particles = [];
        this.waves = [];
        this.sparkles = [];
        this.isActive = false;
        this.animationFrame = null;
        this.particleCount = 0;
        this.maxParticles = 25;
        this.lastParticleTime = 0;
        this.particleInterval = 300; // ms between particle spawns
    }

    /**
     * Initialize the healing wind VFX system
     */
    initialize() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'healing-wind-container';
        this.container.id = 'healing-wind-vfx';
        
        // Add to document body
        document.body.appendChild(this.container);
        
        console.log('[HealingWindVFX] Initialized');
    }

    /**
     * Start the healing wind effect
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        document.body.classList.add('stage-healing-wind');
        
        // Create initial wave
        this.createWave();
        
        // Start particle generation
        this.animate();
        
        // Create periodic waves
        this.waveInterval = setInterval(() => {
            if (this.isActive) {
                this.createWave();
            }
        }, 8000);
        
        // Create periodic sparkles
        this.sparkleInterval = setInterval(() => {
            if (this.isActive) {
                this.createSparkles();
            }
        }, 2000);
        
        console.log('[HealingWindVFX] Started');
    }

    /**
     * Stop the healing wind effect
     */
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        document.body.classList.remove('stage-healing-wind');
        
        // Clear intervals
        if (this.waveInterval) {
            clearInterval(this.waveInterval);
            this.waveInterval = null;
        }
        
        if (this.sparkleInterval) {
            clearInterval(this.sparkleInterval);
            this.sparkleInterval = null;
        }
        
        // Stop animation loop
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Clear all particles gradually
        this.fadeOutAllParticles();
        
        console.log('[HealingWindVFX] Stopped');
    }

    /**
     * Main animation loop
     */
    animate() {
        if (!this.isActive) return;
        
        const now = Date.now();
        
        // Create new particles periodically
        if (now - this.lastParticleTime > this.particleInterval && this.particleCount < this.maxParticles) {
            this.createParticle();
            this.lastParticleTime = now;
        }
        
        // Continue animation
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Create a healing wind particle
     */
    createParticle() {
        const particle = document.createElement('div');
        particle.className = this.getParticleClasses();
        
        // Random starting position (left side of screen, random height)
        const startY = Math.random() * window.innerHeight;
        particle.style.left = '-20px';
        particle.style.top = startY + 'px';
        
        // Add to container
        this.container.appendChild(particle);
        this.particles.push(particle);
        this.particleCount++;
        
        // Remove particle after animation completes
        const duration = this.getAnimationDuration(particle);
        setTimeout(() => {
            this.removeParticle(particle);
        }, duration);
    }

    /**
     * Get random particle classes
     */
    getParticleClasses() {
        const sizes = ['small', '', 'large'];
        const patterns = ['pattern-1', 'pattern-2', 'pattern-3', 'pattern-4'];
        const hasSway = Math.random() < 0.3; // 30% chance for swaying motion
        
        let classes = ['healing-wind-particle'];
        
        // Add size
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        if (size) classes.push(size);
        
        // Add pattern
        classes.push(patterns[Math.floor(Math.random() * patterns.length)]);
        
        // Add sway
        if (hasSway) classes.push('sway');
        
        return classes.join(' ');
    }

    /**
     * Get animation duration for a particle
     */
    getAnimationDuration(particle) {
        if (particle.classList.contains('pattern-1')) return 8000;
        if (particle.classList.contains('pattern-2')) return 12000;
        if (particle.classList.contains('pattern-3')) return 10000;
        if (particle.classList.contains('pattern-4')) return 14000;
        return 8000; // fallback
    }

    /**
     * Remove a particle
     */
    removeParticle(particle) {
        if (particle && particle.parentNode) {
            particle.parentNode.removeChild(particle);
            
            // Remove from array
            const index = this.particles.indexOf(particle);
            if (index > -1) {
                this.particles.splice(index, 1);
                this.particleCount--;
            }
        }
    }

    /**
     * Create a healing wave effect
     */
    createWave() {
        const wave = document.createElement('div');
        wave.className = 'healing-wind-wave';
        
        // Random vertical position
        const waveY = Math.random() * window.innerHeight * 0.8 + window.innerHeight * 0.1;
        wave.style.top = waveY + 'px';
        
        // Add to container
        this.container.appendChild(wave);
        this.waves.push(wave);
        
        // Remove wave after animation
        setTimeout(() => {
            if (wave && wave.parentNode) {
                wave.parentNode.removeChild(wave);
                const index = this.waves.indexOf(wave);
                if (index > -1) {
                    this.waves.splice(index, 1);
                }
            }
        }, 6000);
    }

    /**
     * Create sparkle effects
     */
    createSparkles() {
        const sparkleCount = Math.floor(Math.random() * 5) + 3; // 3-7 sparkles
        
        for (let i = 0; i < sparkleCount; i++) {
            setTimeout(() => {
                this.createSparkle();
            }, i * 200); // Stagger sparkle creation
        }
    }

    /**
     * Create a single sparkle
     */
    createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.className = 'healing-wind-sparkle';
        
        // Random position
        const sparkleX = Math.random() * window.innerWidth;
        const sparkleY = Math.random() * window.innerHeight;
        sparkle.style.left = sparkleX + 'px';
        sparkle.style.top = sparkleY + 'px';
        
        // Add to container
        this.container.appendChild(sparkle);
        this.sparkles.push(sparkle);
        
        // Remove sparkle after animation
        setTimeout(() => {
            if (sparkle && sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
                const index = this.sparkles.indexOf(sparkle);
                if (index > -1) {
                    this.sparkles.splice(index, 1);
                }
            }
        }, 2000);
    }

    /**
     * Fade out all particles gradually
     */
    fadeOutAllParticles() {
        [...this.particles, ...this.waves, ...this.sparkles].forEach((element, index) => {
            if (element && element.parentNode) {
                setTimeout(() => {
                    element.style.opacity = '0';
                    element.style.transition = 'opacity 1s ease-out';
                    
                    setTimeout(() => {
                        if (element.parentNode) {
                            element.parentNode.removeChild(element);
                        }
                    }, 1000);
                }, index * 50); // Stagger the fade out
            }
        });
        
        // Clear arrays
        this.particles = [];
        this.waves = [];
        this.sparkles = [];
        this.particleCount = 0;
    }

    /**
     * Enhance healing numbers with special styling
     */
    enhanceHealingNumber(element) {
        if (element) {
            element.classList.add('healing-wind-number');
        }
    }

    /**
     * Cleanup all VFX
     */
    destroy() {
        this.stop();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
        this.particles = [];
        this.waves = [];
        this.sparkles = [];
        
        console.log('[HealingWindVFX] Destroyed');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealingWindVFX;
} else {
    window.HealingWindVFX = HealingWindVFX;
} 