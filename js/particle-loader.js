/**
 * Single Particle Loading Animation with Trail Effect
 * Version: 2.0.0
 * Author: Echen Deligani
 * Last Updated: 2025-03-17
 */
class ParticleLoader {
    constructor(canvas, options = {}) {
        // Default options with better type checking
        this.options = {
            particleSize: this.validateNumber(options.particleSize, 6),
            particleColor: this.validateColor(options.particleColor, '#007bff'),
            trailColor: this.validateColor(options.trailColor, 'rgba(0, 123, 255, 0.3)'),
            glowColor: this.validateColor(options.glowColor, 'rgba(0, 123, 255, 0.5)'),
            speed: this.validateNumber(options.speed, 2),
            trailLength: this.validateNumber(options.trailLength, 20),
            backgroundColor: this.validateColor(options.backgroundColor, 'rgba(0, 0, 0, 0.8)')
        };

        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('ParticleLoader requires a valid canvas element');
        }

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.progress = 0;
        this.isActive = false;
        this.frameId = null;
        this.lastFrameTime = 0;

        this.particle = {
            x: 0,
            y: 0,
            trail: []
        };

        this.oscillation = {
            amplitude: 10,
            frequency: 0.05,
            offset: 0
        };

        // Bind methods
        this.animate = this.animate.bind(this);
        this.resize = this.resize.bind(this);

        // Initialize
        this.init();
    }

    // Validation helpers
    validateNumber(value, defaultValue) {
        return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
    }

    validateColor(value, defaultValue) {
        return typeof value === 'string' &&
            (value.startsWith('#') || value.startsWith('rgb')) ? value : defaultValue;
    }

    init() {
        this.resize();
        this.setupResizeObserver();
        this.resetParticle();
    }

    setupResizeObserver() {
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(this.debounce(() => {
                this.resize();
            }, 250));
            this.resizeObserver.observe(this.canvas);
        } else {
            window.addEventListener('resize', this.debounce(this.resize, 250));
        }
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Add safety check for zero dimensions
        if (rect.width === 0 || rect.height === 0) {
            console.warn('Canvas has zero dimensions, skipping resize and draw operations');
            return;
        }

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        // Scale context for retina displays
        this.ctx.scale(dpr, dpr);

        // Check if mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

        // Calculate loading bar dimensions - larger for mobile
        this.barWidth = this.canvas.width * 0.8;
        this.barHeight = isMobile ? 8 * dpr : 4 * dpr;
        this.barX = (this.canvas.width - this.barWidth) / 2;
        this.barY = this.canvas.height * 0.7; // Position higher on screen

        // Reset particle position
        this.resetParticle();

        console.log(`ParticleLoader canvas resized: ${this.canvas.width}x${this.canvas.height}, Mobile: ${isMobile}, DPR: ${dpr}`);
    }

    resetParticle() {
        this.particle.x = this.barX;
        this.particle.y = this.barY + (this.barHeight / 2);
        this.particle.trail = [];
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.lastFrameTime = performance.now();
        this.frameId = requestAnimationFrame(this.animate);
    }

    stop() {
        this.isActive = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    setProgress(progress) {
        this.progress = Math.min(Math.max(progress, 0), 1);
    }

    drawGlow(x, y, radius, color) {
        // Check if mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

        // Create gradient with enhanced visibility for mobile
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);

        // For mobile devices, use more prominent gradient stops
        if (isMobile) {
            // Fix for color manipulation
            let middleColor;

            // Check if color is already in RGBA format
            if (color.startsWith('rgba')) {
                // Extract the RGB values
                const rgbValues = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
                if (rgbValues) {
                    // Create a new color with 0.5 alpha
                    middleColor = `rgba(${rgbValues[1]}, ${rgbValues[2]}, ${rgbValues[3]}, 0.5)`;
                } else {
                    // Fallback
                    middleColor = 'rgba(255, 36, 0, 0.5)';
                }
            } else if (color.startsWith('rgb')) {
                // Convert RGB to RGBA with 0.5 alpha
                middleColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.5)');
            } else {
                // For hex or other formats, use default
                middleColor = 'rgba(255, 36, 0, 0.5)';
            }

            gradient.addColorStop(0, color);
            gradient.addColorStop(0.6, middleColor);
            gradient.addColorStop(1, 'rgba(255, 36, 0, 0)');
        } else {
            gradient.addColorStop(0, color);
            // Use red-themed transparent color to match the red theme
            gradient.addColorStop(1, 'rgba(255, 36, 0, 0)');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    animate(timestamp) {
        if (!this.isActive) return;

        // Check for zero dimensions
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.warn('Canvas has zero dimensions, skipping animation frame');
            this.frameId = requestAnimationFrame(this.animate);
            return;
        }

        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // Clear canvas with background
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw loading bar background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(this.barX, this.barY, this.barWidth, this.barHeight);

        // Calculate target position
        const targetX = this.barX + (this.barWidth * this.progress);

        // Update particle position with oscillation
        if (this.progress === 0) {
            this.oscillation.offset += this.oscillation.frequency * (deltaTime / 16.67);
            const oscillationX = Math.sin(this.oscillation.offset) * this.oscillation.amplitude;
            this.particle.x = this.barX + this.barWidth * 0.1 + oscillationX;
        } else {
            this.particle.x += (targetX - this.particle.x) * 0.1 * (deltaTime / 16.67);
        }

        // Update trail
        this.particle.trail.unshift({ x: this.particle.x, y: this.particle.y });
        if (this.particle.trail.length > this.options.trailLength) {
            this.particle.trail.pop();
        }

        // Draw progress bar
        const progressGradient = this.ctx.createLinearGradient(
            this.barX, 0, this.particle.x, 0
        );
        progressGradient.addColorStop(0, this.options.particleColor);
        progressGradient.addColorStop(1, this.options.glowColor);

        this.ctx.fillStyle = progressGradient;
        this.ctx.fillRect(this.barX, this.barY, this.particle.x - this.barX, this.barHeight);

        // Draw trail and particle
        this.drawTrailAndParticle();

        this.frameId = requestAnimationFrame(this.animate);
    }

    drawTrailAndParticle() {
        // Check if mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

        // Apply a size multiplier for mobile
        const sizeMult = isMobile ? 1.5 : 1;

        // Draw trail
        this.particle.trail.forEach((pos, index) => {
            const alpha = (this.options.trailLength - index) / this.options.trailLength;
            // Use a direct rgba color string instead of relying on string replacement
            const trailColor = `rgba(255, 36, 0, ${alpha * 0.5})`;

            this.drawGlow(
                pos.x,
                pos.y,
                this.options.particleSize * (1 + alpha) * sizeMult,
                trailColor
            );
        });

        // Draw main particle with glow
        this.drawGlow(
            this.particle.x,
            this.particle.y,
            this.options.particleSize * 9 * sizeMult,  // Increased from 3 to 9 for 3x bigger glow
            isMobile ? 'rgba(255, 36, 0, 0.7)' : this.options.glowColor  // Brighter glow for mobile
        );

        // Draw particle
        this.ctx.beginPath();
        this.ctx.fillStyle = '#FF3800';  // Brighter particle color
        this.ctx.arc(
            this.particle.x,
            this.particle.y,
            this.options.particleSize * sizeMult,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    dispose() {
        this.stop();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        window.removeEventListener('resize', this.resize);
    }
}
