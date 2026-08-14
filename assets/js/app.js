/**
 * Absensi Digital - Core JS Utilities
 */

// Live Digital Clock
function updateLiveClock() {
    const clockElements = document.querySelectorAll('.live-clock');
    if (clockElements.length === 0) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;

    clockElements.forEach(el => {
        el.textContent = timeStr;
    });
}

setInterval(updateLiveClock, 1000);
document.addEventListener('DOMContentLoaded', updateLiveClock);

// Web Audio API Sound Chime Generator for Scans
const SoundEffects = {
    audioCtx: null,

    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    },

    playSuccess() {
        try {
            this.init();
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
            osc.frequency.setValueAtTime(880, this.audioCtx.currentTime + 0.1); // A5

            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.35);
        } catch (e) {
            console.log('Audio error:', e);
        }
    },

    playWarning() {
        try {
            this.init();
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
            osc.frequency.setValueAtTime(330, this.audioCtx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.4);
        } catch (e) {
            console.log('Audio error:', e);
        }
    },

    playError() {
        try {
            this.init();
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
            osc.frequency.setValueAtTime(160, this.audioCtx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.4);
        } catch (e) {
            console.log('Audio error:', e);
        }
    }
};

// Toast Notifications Helper
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColors = {
        success: 'bg-emerald-700 text-white border-emerald-600',
        warning: 'bg-amber-600 text-white border-amber-500',
        error: 'bg-rose-700 text-white border-rose-600',
        info: 'bg-blue-700 text-white border-blue-600'
    };

    const icons = {
        success: '<i class="fa-solid fa-circle-check text-lg"></i>',
        warning: '<i class="fa-solid fa-triangle-exclamation text-lg"></i>',
        error: '<i class="fa-solid fa-circle-xmark text-lg"></i>',
        info: '<i class="fa-solid fa-circle-info text-lg"></i>'
    };

    toast.className = `${bgColors[type] || bgColors.success} pointer-events-auto p-4 rounded-xl shadow-lg flex items-center gap-3 border transition-all duration-300 transform translate-x-full opacity-0`;
    toast.innerHTML = `
        <div>${icons[type] || icons.success}</div>
        <div class="text-sm font-medium flex-1">${message}</div>
        <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white text-sm">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
