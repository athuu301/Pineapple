/* ==========================================================================
   VAIGA - PINEAPPLE & TROPICAL FRUIT ENTITY ENGINE
   Handles fruit physics, line-segment slice collision, and sliced half-piece physics.
   ========================================================================== */

export class Pineapple {
    constructor(x, y, vx, vy, type = 'classic') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = type === 'bomb' ? 36 : (type === 'watermelon' ? 46 : 42);
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.08;
        this.gravity = 0.28;
        this.type = type; // 'classic', 'royal', 'frosty', 'honey', 'watermelon', 'coconut', 'bomb'
        this.isSliced = false;
        
        // Sliced halves state
        this.halves = null;

        // Type configuration
        this.config = {
            classic: { name: 'Golden Pineapple', score: 10, color: '#f4b942', leafColor: '#8ab17d' },
            royal: { name: 'Royal Crown', score: 25, color: '#e76f51', leafColor: '#ffcf56' },
            frosty: { name: 'Frosty Chilled', score: 15, color: '#7eb6c8', leafColor: '#a8d5e5', isFrosty: true },
            honey: { name: 'Honey Comb Star', score: 30, color: '#ffcf56', leafColor: '#f4b942', isBonus: true },
            watermelon: { name: 'Juicy Watermelon', score: 15, color: '#2b9348', fleshColor: '#ff4d6d', isMelon: true },
            coconut: { name: 'Hard Coconut', score: 20, color: '#6c584c', fleshColor: '#ffffff', isCoconut: true },
            bomb: { name: 'RUGGED BOMB', score: -50, color: '#1a1a1a', isBomb: true }
        }[type] || { name: 'Golden Pineapple', score: 10, color: '#f4b942', leafColor: '#8ab17d' };
    }

    update() {
        if (!this.isSliced) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.rotation += this.vRot;
        } else if (this.halves) {
            // Update sliced halves
            this.halves.left.x += this.halves.left.vx;
            this.halves.left.y += this.halves.left.vy;
            this.halves.left.vy += this.gravity;
            this.halves.left.rotation += this.halves.left.vRot;

            this.halves.right.x += this.halves.right.vx;
            this.halves.right.y += this.halves.right.vy;
            this.halves.right.vy += this.gravity;
            this.halves.right.rotation += this.halves.right.vRot;
        }
    }

    checkSlice(segments) {
        if (this.isSliced) return false;

        for (const seg of segments) {
            if (this.lineIntersectsCircle(seg.p1, seg.p2, { x: this.x, y: this.y, radius: this.radius })) {
                this.slice(seg.p1, seg.p2);
                return true;
            }
        }
        return false;
    }

    lineIntersectsCircle(p1, p2, circle) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return false;

        const u = Math.max(0, Math.min(1, ((circle.x - p1.x) * dx + (circle.y - p1.y) * dy) / (len * len)));
        const projX = p1.x + u * dx;
        const projY = p1.y + u * dy;

        return Math.hypot(circle.x - projX, circle.y - projY) <= circle.radius;
    }

    slice(p1, p2) {
        this.isSliced = true;

        if (this.config.isBomb) return; // Bombs don't create sliced halves, they explode!

        // Calculate slice angle
        const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const perpAngle = sliceAngle + Math.PI / 2;

        const pushSpeed = 4;
        this.halves = {
            left: {
                x: this.x,
                y: this.y,
                vx: this.vx - Math.cos(perpAngle) * pushSpeed,
                vy: this.vy - Math.sin(perpAngle) * pushSpeed,
                rotation: this.rotation,
                vRot: -0.1,
                sliceAngle
            },
            right: {
                x: this.x,
                y: this.y,
                vx: this.vx + Math.cos(perpAngle) * pushSpeed,
                vy: this.vy + Math.sin(perpAngle) * pushSpeed,
                rotation: this.rotation,
                vRot: 0.1,
                sliceAngle
            }
        };
    }

    draw(ctx) {
        if (!this.isSliced) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            if (this.config.isBomb) {
                this.drawBomb(ctx);
            } else if (this.config.isMelon) {
                this.drawWatermelon(ctx);
            } else if (this.config.isCoconut) {
                this.drawCoconut(ctx);
            } else {
                this.drawWholePineapple(ctx);
            }
            
            ctx.restore();
        } else if (this.halves) {
            // Draw Left Half
            ctx.save();
            ctx.translate(this.halves.left.x, this.halves.left.y);
            ctx.rotate(this.halves.left.rotation);
            this.drawFruitHalf(ctx, -1);
            ctx.restore();

            // Draw Right Half
            ctx.save();
            ctx.translate(this.halves.right.x, this.halves.right.y);
            ctx.rotate(this.halves.right.rotation);
            this.drawFruitHalf(ctx, 1);
            ctx.restore();
        }
    }

    drawBomb(ctx) {
        // Metallic Spikes
        ctx.fillStyle = '#444444';
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            ctx.save();
            ctx.rotate(angle);
            ctx.fillRect(-4, -this.radius - 8, 8, 10);
            ctx.restore();
        }

        // Bomb Core Sphere
        const grad = ctx.createRadialGradient(-8, -8, 4, 0, 0, this.radius);
        grad.addColorStop(0, '#555555');
        grad.addColorStop(0.7, '#1a1a1a');
        grad.addColorStop(1, '#000000');

        ctx.fillStyle = grad;
        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Skull or Warning Symbol
        ctx.fillStyle = '#ff3300';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 2);

        // Fuse Wire & Sparkle
        ctx.strokeStyle = '#d4a373';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.quadraticCurveTo(15, -this.radius - 15, 8, -this.radius - 28);
        ctx.stroke();

        // Flickering Fuse Spark
        ctx.fillStyle = Math.random() < 0.5 ? '#ffcc00' : '#ff3300';
        ctx.beginPath();
        ctx.arc(8, -this.radius - 28, Math.random() * 5 + 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWatermelon(ctx) {
        ctx.fillStyle = '#2b9348';
        ctx.strokeStyle = '#1b4332';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 0.9, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Stripes
        ctx.strokeStyle = '#55a630';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = -20; i <= 20; i += 10) {
            ctx.moveTo(i, -this.radius + 6);
            ctx.quadraticCurveTo(i + 8, 0, i, this.radius - 6);
        }
        ctx.stroke();
    }

    drawCoconut(ctx) {
        ctx.fillStyle = '#6c584c';
        ctx.strokeStyle = '#382519';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hairy Texture
        ctx.strokeStyle = '#a38970';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-8, -8, 3, 0, Math.PI * 2);
        ctx.arc(6, 4, 3, 0, Math.PI * 2);
        ctx.arc(4, -10, 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawWholePineapple(ctx) {
        // Green Crown Leaves
        ctx.fillStyle = this.config.leafColor;
        ctx.beginPath();
        ctx.moveTo(-10, -32);
        ctx.quadraticCurveTo(-22, -60, -8, -68);
        ctx.quadraticCurveTo(0, -45, 0, -32);
        ctx.quadraticCurveTo(0, -45, 8, -68);
        ctx.quadraticCurveTo(22, -60, 10, -32);
        ctx.closePath();
        ctx.fill();

        // Pineapple Oval Body
        ctx.fillStyle = this.config.color;
        ctx.strokeStyle = '#3a2312';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 0.82, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Honeycomb Crosshatch Pattern
        ctx.strokeStyle = 'rgba(58, 35, 18, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = -24; i <= 24; i += 12) {
            ctx.moveTo(i, -30);
            ctx.lineTo(i + 12, 30);
            ctx.moveTo(i + 12, -30);
            ctx.lineTo(i, 30);
        }
        ctx.stroke();

        if (this.config.isFrosty) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-10, -12, 5, 0, Math.PI * 2);
            ctx.arc(12, 10, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawFruitHalf(ctx, side) {
        ctx.save();
        ctx.scale(side, 1);

        if (this.config.isMelon) {
            ctx.fillStyle = '#2b9348';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 0.9, this.radius, 0, -Math.PI / 2, Math.PI / 2);
            ctx.fill();

            // Red Flesh
            ctx.fillStyle = '#ff4d6d';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 0.72, this.radius * 0.88, 0, -Math.PI / 2, Math.PI / 2);
            ctx.fill();

            // Black Seeds
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(12, -10, 2, 0, Math.PI * 2);
            ctx.arc(16, 12, 2, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.config.isCoconut) {
            ctx.fillStyle = '#6c584c';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius, this.radius, 0, -Math.PI / 2, Math.PI / 2);
            ctx.fill();

            // White Coconut Flesh
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 0.75, this.radius * 0.85, 0, -Math.PI / 2, Math.PI / 2);
            ctx.fill();

        } else {
            // Green Crown Half
            ctx.fillStyle = this.config.leafColor;
            ctx.beginPath();
            ctx.moveTo(0, -32);
            ctx.quadraticCurveTo(15, -60, 8, -68);
            ctx.quadraticCurveTo(0, -45, 0, -32);
            ctx.closePath();
            ctx.fill();

            // Outer Skin & Juicy Inner Yellow Core
            ctx.fillStyle = this.config.color;
            ctx.strokeStyle = '#3a2312';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 0.82, this.radius, 0, -Math.PI / 2, Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Sliced Flesh Juicy Interior
            ctx.fillStyle = '#fff0a5';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 0.65, this.radius * 0.85, 0, -Math.PI / 2, Math.PI / 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

