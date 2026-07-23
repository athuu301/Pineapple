/* ==========================================================================
   VAIGA - CORE GAME ENGINE & LOGIC MANAGER
   Manages game loops, fruit spawning, slicing collision, score & timer states.
   ========================================================================== */

import { Pineapple } from './pineapple.js';
import { Blade } from './blade.js';
import { ParticleEngine } from './particles.js';
import { SoundManager } from './audio.js';

export class Game {
    constructor(canvas, uiManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiManager;
        this.sound = new SoundManager();

        this.blade = new Blade();
        this.particles = new ParticleEngine();

        this.fruits = [];
        this.mode = 'zen'; // 'zen' or 'timed'
        this.isPlaying = false;
        this.isPaused = false;

        this.score = 0;
        this.totalSliced = 0;
        this.maxCombo = 0;
        this.timer = 60;
        this.timerInterval = null;

        this.spawnTimer = 0;
        this.spawnInterval = 65; // Frames between launches

        this.comboCount = 0;
        this.comboResetTimeout = null;

        this.shakeTime = 0;
        this.shakeIntensity = 0;

        this.resize();
        this.bindEvents();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        // Pointer / Touch Events for Mouse and Touch Devices
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
            }
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const handleStart = (e) => {
            if (!this.isPlaying || this.isPaused) return;
            this.sound.init();
            const pos = getPos(e);
            this.blade.addPoint(pos.x, pos.y);
        };

        const handleMove = (e) => {
            if (!this.isPlaying || this.isPaused) return;
            const pos = getPos(e);
            this.blade.addPoint(pos.x, pos.y);
        };

        const handleEnd = () => {
            this.blade.stopSwipe();
        };

        this.canvas.addEventListener('pointerdown', handleStart);
        this.canvas.addEventListener('pointermove', handleMove);
        this.canvas.addEventListener('pointerup', handleEnd);

        this.canvas.addEventListener('touchstart', handleStart, { passive: true });
        this.canvas.addEventListener('touchmove', handleMove, { passive: true });
        this.canvas.addEventListener('touchend', handleEnd, { passive: true });
    }

    start(mode = 'zen') {
        this.mode = mode;
        this.score = 0;
        this.totalSliced = 0;
        this.maxCombo = 0;
        this.timer = 60;
        this.fruits = [];
        this.isPlaying = true;
        this.isPaused = false;
        this.shakeTime = 0;

        this.ui.updateScore(0);
        this.ui.showHUD(mode === 'timed');

        if (mode === 'timed') {
            this.ui.updateTimer(60);
            clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => {
                if (!this.isPaused && this.isPlaying) {
                    this.timer--;
                    this.ui.updateTimer(this.timer);
                    if (this.timer <= 0) {
                        this.endGame();
                    }
                }
            }, 1000);
        }
    }

    pause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    endGame() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);

        // Update Best Score in LocalStorage
        const currentBest = parseInt(localStorage.getItem('vaiga_best_score') || '0');
        if (this.score > currentBest) {
            localStorage.setItem('vaiga_best_score', this.score.toString());
        }

        this.ui.showGameOver(this.score, this.totalSliced, this.maxCombo);
    }

    spawnFruit() {
        const types = ['classic', 'classic', 'royal', 'frosty', 'honey', 'watermelon', 'coconut'];
        const isBomb = Math.random() < 0.22;
        const type = isBomb ? 'bomb' : types[Math.floor(Math.random() * types.length)];

        // Launch positions from bottom of canvas
        const margin = 100;
        const x = margin + Math.random() * (this.width - margin * 2);
        const y = this.height + 40;

        // Launch towards upper-middle area
        const targetX = this.width / 2 + (Math.random() - 0.5) * 300;
        const targetY = 120 + Math.random() * 200;

        const timeToApex = 45; // Frames to apex
        const vx = (targetX - x) / timeToApex;
        const vy = -Math.sqrt(2 * 0.28 * (y - targetY)); // Gravity equation v^2 = 2gH

        this.fruits.push(new Pineapple(x, y, vx, vy, type));
    }

    triggerShake(intensity = 16, duration = 20) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    update() {
        if (!this.isPlaying || this.isPaused) return;

        // 1. Blade & Swipe Updates
        this.blade.update();

        // 2. Fruit Spawning Logic
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            const count = Math.random() < 0.35 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                this.spawnFruit();
            }
            this.spawnTimer = 0;
        }

        // 3. Fruit Physics & Slice Checks
        const sliceSegments = this.blade.getSliceSegments();
        let slicedThisFrame = 0;

        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            fruit.update();

            // Check slice collision
            if (!fruit.isSliced && sliceSegments.length > 0) {
                if (fruit.checkSlice(sliceSegments)) {
                    if (fruit.config.isBomb) {
                        // BOMB SLICED! Explosion trigger
                        this.sound.playExplosionSound();
                        this.particles.createExplosion(fruit.x, fruit.y);
                        this.triggerShake(22, 28);
                        this.particles.addScorePopup(fruit.x, fruit.y, '💥 BOOM!', '#ff3300');

                        if (this.mode === 'timed') {
                            this.timer = Math.max(0, this.timer - 10);
                            this.ui.updateTimer(this.timer);
                        }
                        this.score = Math.max(0, this.score - 50);
                        this.ui.updateScore(this.score);

                        this.fruits.splice(i, 1);
                        continue;
                    }

                    slicedThisFrame++;
                    this.totalSliced++;
                    this.score += fruit.config.score;

                    // Trigger sound & visual particle splatter
                    this.sound.playSliceSound();
                    this.sound.playSplatterSound();
                    this.particles.createSplatter(fruit.x, fruit.y, fruit.config.color);
                    this.particles.createSparkles(fruit.x, fruit.y, 8);
                    this.particles.addScorePopup(fruit.x, fruit.y, `+${fruit.config.score}`, fruit.config.color);

                    this.ui.updateScore(this.score);
                }
            }

            // Remove out-of-bounds fruits
            if (fruit.y > this.height + 100) {
                this.fruits.splice(i, 1);
            }
        }

        // 4. Combo Multiplier Detection
        if (slicedThisFrame > 0) {
            this.comboCount += slicedThisFrame;
            clearTimeout(this.comboResetTimeout);

            this.comboResetTimeout = setTimeout(() => {
                if (this.comboCount >= 3) {
                    const comboBonus = this.comboCount * 15;
                    this.score += comboBonus;
                    if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

                    this.sound.playComboSound(this.comboCount);
                    this.triggerShake(8, 10);
                    this.ui.showComboText(`${this.comboCount}x RUGGED COMBO! +${comboBonus}`);
                    this.ui.updateScore(this.score);
                }
                this.comboCount = 0;
            }, 250);
        }

        // 5. Update Particle System
        this.particles.update(this.width, this.height);
    }

    render() {
        let shakeX = 0;
        let shakeY = 0;
        if (this.shakeTime > 0) {
            this.shakeTime--;
            shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        }

        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);

        // Clear Background with dynamic gradient
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, '#0d0e15');
        bgGrad.addColorStop(1, '#1b1d2a');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Render Ambient Sunbeams & Particles
        this.particles.draw(this.ctx, this.width, this.height);

        // Render Fruits & Sliced Halves
        this.fruits.forEach(fruit => fruit.draw(this.ctx));

        // Render Blade Trail
        this.blade.draw(this.ctx);

        this.ctx.restore();
    }
}

