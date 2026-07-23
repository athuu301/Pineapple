/* ==========================================================================
   VAIGA - BLADE TRAIL SWIPE CONTROLLER
   Tracks touch/mouse movement, renders glowing trail paths, and detects slices.
   ========================================================================== */

export class Blade {
    constructor() {
        this.points = [];
        this.maxPoints = 14;
        this.style = 'sunbeam'; // 'sunbeam', 'honey', 'matcha', 'rainbow'
        this.isSwiping = false;
        
        // Blade Styles Gradient definitions
        this.styles = {
            sunbeam: { main: '#ffcf56', glow: 'rgba(255, 207, 86, 0.6)', width: 12 },
            honey: { main: '#e76f51', glow: 'rgba(231, 111, 81, 0.6)', width: 14 },
            matcha: { main: '#8ab17d', glow: 'rgba(138, 177, 125, 0.6)', width: 12 },
            rainbow: { main: '#ff9a9e', glow: 'rgba(255, 154, 158, 0.6)', width: 16 }
        };
    }

    setStyle(styleName) {
        if (this.styles[styleName]) {
            this.style = styleName;
        }
    }

    addPoint(x, y) {
        this.isSwiping = true;
        this.points.push({ x, y, time: performance.now() });

        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }

    stopSwipe() {
        this.isSwiping = false;
    }

    update() {
        // Fade out points if idle
        const now = performance.now();
        this.points = this.points.filter(p => now - p.time < 180);
    }

    getSliceSegments() {
        // Returns recent line segments for slice intersection testing
        const segments = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            segments.push({
                p1: this.points[i],
                p2: this.points[i + 1]
            });
        }
        return segments;
    }

    draw(ctx) {
        if (this.points.length < 2) return;

        const styleConfig = this.styles[this.style] || this.styles.sunbeam;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer Glow Path
        ctx.strokeStyle = styleConfig.glow;
        ctx.lineWidth = styleConfig.width * 1.8;
        ctx.shadowColor = styleConfig.main;
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();

        // Inner Sharp Trail
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = styleConfig.width * 0.6;
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();

        ctx.restore();
    }
}
