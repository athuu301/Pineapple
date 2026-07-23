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
        this.radius = 42;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.08;
        this.gravity = 0.28;
        this.type = type; // 'classic', 'royal', 'frosty', 'honey'
        this.isSliced = false;
        
        // Sliced halves state
        this.halves = null;

        // Type configuration
        this.config = {
            classic: { name: 'Golden Pineapple', score: 10, color: '#f4b942', leafColor: '#8ab17d' },
            royal: { name: 'Royal Crown', score: 25, color: '#e76f51', leafColor: '#ffcf56' },
            frosty: { name: 'Frosty Chilled', score: 15, color: '#7eb6c8', leafColor: '#a8d5e5', isFrosty: true },
            honey: { name: 'Honey Comb Star', score: 30, color: '#ffcf56', leafColor: '#f4b942', isBonus: true }
        }[type] || { score: 10, color: '#f4b942', leafColor: '#8ab17d' };
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
            this.drawWholePineapple(ctx);
            ctx.restore();
        } else if (this.halves) {
            // Draw Left Half
            ctx.save();
            ctx.translate(this.halves.left.x, this.halves.left.y);
            ctx.rotate(this.halves.left.rotation);
            this.drawPineappleHalf(ctx, -1);
            ctx.restore();

            // Draw Right Half
            ctx.save();
            ctx.translate(this.halves.right.x, this.halves.right.y);
            ctx.rotate(this.halves.right.rotation);
            this.drawPineappleHalf(ctx, 1);
            ctx.restore();
        }
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

        // Cozy Honeycomb Crosshatch Pattern
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

        // Frosty or Royal Sparkle Accents
        if (this.config.isFrosty) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-10, -12, 5, 0, Math.PI * 2);
            ctx.arc(12, 10, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawPineappleHalf(ctx, side) {
        // Render Sliced Pineapple Half with Juicy Flesh Cross-section
        ctx.save();
        ctx.scale(side, 1);

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

        ctx.restore();
    }
}
