/* ==========================================================================
   VAIGA - APPLICATION BOOTSTRAPPER & UI HANDLER
   Integrates UI screens, modals, state management, and the main animation loop.
   ========================================================================== */

import { Game } from './game.js';

class UIManager {
    constructor() {
        this.startScreen = document.getElementById('start-screen');
        this.gameHUD = document.getElementById('game-hud');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.bladeModal = document.getElementById('blade-modal');

        this.scoreEl = document.getElementById('current-score');
        this.timerContainer = document.getElementById('timer-container');
        this.timerEl = document.getElementById('timer-val');

        this.bestScoreEl = document.getElementById('best-score-val');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalSlicedEl = document.getElementById('final-sliced');
        this.finalMaxComboEl = document.getElementById('final-max-combo');

        this.comboDisplay = document.getElementById('combo-display');
        this.comboTextEl = document.getElementById('combo-text');

        this.updateBestScoreDisplay();
    }

    updateBestScoreDisplay() {
        const best = localStorage.getItem('vaiga_best_score') || '0';
        if (this.bestScoreEl) this.bestScoreEl.textContent = best;
    }

    showHUD(isTimed = false) {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.gameHUD.classList.remove('hidden');

        if (isTimed) {
            this.timerContainer.classList.remove('hidden');
        } else {
            this.timerContainer.classList.add('hidden');
        }
    }

    showMenu() {
        this.updateBestScoreDisplay();
        this.gameHUD.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    showGameOver(score, sliced, maxCombo) {
        this.finalScoreEl.textContent = score;
        this.finalSlicedEl.textContent = sliced;
        this.finalMaxComboEl.textContent = `${maxCombo}x`;
        this.updateBestScoreDisplay();

        this.gameHUD.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
    }

    updateScore(score) {
        if (this.scoreEl) this.scoreEl.textContent = score;
    }

    updateTimer(seconds) {
        if (this.timerEl) this.timerEl.textContent = seconds;
    }

    showComboText(text) {
        if (!this.comboDisplay || !this.comboTextEl) return;
        this.comboTextEl.textContent = text;
        this.comboDisplay.classList.remove('hidden');

        clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            this.comboDisplay.classList.add('hidden');
        }, 800);
    }
}

// Instantiate Game Application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ui = new UIManager();
    const game = new Game(canvas, ui);

    // Menu Buttons
    const btnZen = document.getElementById('btn-mode-zen');
    if (btnZen) {
        btnZen.addEventListener('click', () => {
            game.sound.init();
            game.start('zen');
        });
    }

    const btnTimed = document.getElementById('btn-mode-timed');
    if (btnTimed) {
        btnTimed.addEventListener('click', () => {
            game.sound.init();
            game.start('timed');
        });
    }

    // Sound Toggles
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const btnHudSound = document.getElementById('btn-hud-sound');

    const toggleAudio = () => {
        const enabled = game.sound.toggleSound();
        const icon = enabled ? '🔊' : '🔇';
        if (btnSoundToggle) btnSoundToggle.textContent = icon;
        if (btnHudSound) btnHudSound.textContent = icon;
    };

    if (btnSoundToggle) btnSoundToggle.addEventListener('click', toggleAudio);
    if (btnHudSound) btnHudSound.addEventListener('click', toggleAudio);

    // Pause Button
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
        btnPause.addEventListener('click', () => {
            const isPaused = game.pause();
            btnPause.textContent = isPaused ? '▶️' : '⏸️';
        });
    }

    // Game Over Buttons
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            game.start(game.mode);
        });
    }

    const btnMainMenu = document.getElementById('btn-main-menu');
    if (btnMainMenu) {
        btnMainMenu.addEventListener('click', () => {
            ui.showMenu();
        });
    }

    // Blade Customization Modal
    const btnBladeSelect = document.getElementById('btn-blade-select');
    const btnCloseBlade = document.getElementById('btn-close-blade');
    const bladeModal = document.getElementById('blade-modal');

    if (btnBladeSelect && bladeModal) {
        btnBladeSelect.addEventListener('click', () => bladeModal.classList.remove('hidden'));
    }
    if (btnCloseBlade && bladeModal) {
        btnCloseBlade.addEventListener('click', () => bladeModal.classList.add('hidden'));
    }

    // Blade Style Selection
    document.querySelectorAll('.blade-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;
            document.querySelectorAll('.blade-option').forEach(b => b.classList.remove('active'));
            target.classList.add('active');

            const style = target.getAttribute('data-blade');
            game.blade.setStyle(style);
            bladeModal.classList.add('hidden');
        });
    });

    // Main 60 FPS Animation Loop
    function loop() {
        game.update();
        game.render();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
});
