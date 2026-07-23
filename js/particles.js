/* ==========================================================================
   VAIGA - PARTICLE ENGINE & VISUAL EFFECTS
   Renders juicy fruit splashes, floating sunbeams, leaf debris, and score popups.
   ========================================================================== */

export class ParticleEngine {
    constructor() {
        this.particles = [];
        this.scorePopups = [];
        this.sunbeams = [];
        this.initSunbeams();
    }

    initSunbeams() {
        // Floating ambient cozy background sunbeams
        for (let i = 0; i < 6; i++) {
            this.sunbeams.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                radius: Math.random() * 80 + 40,
                speedY: Math.random() * -0.2 - 0.1,
                opacity: Math.random() * 0.15 + 0.05
            });
        }
    }

    createSplatter(x, y, color = '#f4b942', count = 18) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - Math.random() * 2,
                radius: Math.random() * 5 + 3,
                color,
                life: 1.0,
                decay: Math.random() * 0.03 + 0.015,
                gravity: 0.25,
                type: 'splatter'
            });
        }
    }

    createSparkles(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: Math.random() * 6 + 4,
                color: '#ffffff',
                life: 1.0,
                decay: Math.random() * 0.04 + 0.02,
                gravity: 0.05,
                rotation: Math.random() * Math.PI,
                type: 'sparkle'
            });
        }
    }

    addScorePopup(x, y, text, color = '#ffcf56') {
        this.scorePopups.push({
            x, y,
            text,
            color,
            vy: -2,
            life: 1.0,
            decay: 0.02,
            scale: 1.2
        });
    }

    update(width, height) {
        // Update ambient sunbeams
        this.sunbeams.forEach(beam => {
            beam.y += beam.speedY;
            if (beam.y + beam.radius < 0) {
                beam.y = height + beam.radius;
                beam.x = Math.random() * width;
            }
        });

        // Update juice & sparkle particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y += popup.vy;
            popup.life -= popup.decay;
            popup.scale = Math.max(1.0, popup.scale * 0.98);

            if (popup.life <= 0) {
                this.scorePopups.splice(i, 1);
            }
        }
    }

    draw(ctx, width, height) {
        // Draw cozy ambient sunbeams
        this.sunbeams.forEach(beam => {
            ctx.save();
            const grad = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, beam.radius);
            grad.addColorStop(0, `rgba(255, 230, 160, ${beam.opacity})`);
            grad.addColorStop(1, 'rgba(255, 230, 160, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(beam.x, beam.y, beam.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw particles
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);

            if (p.type === 'splatter') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'sparkle') {
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }

            ctx.restore();
        });

        // Draw Score Popups
        this.scorePopups.forEach(popup => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, popup.life);
            ctx.font = 'bold 22px "Fredoka", sans-serif';
            ctx.fillStyle = popup.color;
            ctx.strokeStyle = '#3a2312';
            ctx.lineWidth = 4;
            ctx.textAlign = 'center';
            ctx.strokeText(popup.text, popup.x, popup.y);
            ctx.fillText(popup.text, popup.x, popup.y);
            ctx.restore();
        });
    }
}
