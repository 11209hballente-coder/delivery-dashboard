document.addEventListener('DOMContentLoaded', () => {
    
    // DOM Elements
    const shiftControls = document.getElementById('shift-controls');
    const activeDashboard = document.getElementById('active-dashboard');
    
    const startShiftBtn = document.getElementById('start-shift-btn');
    const endShiftBtn = document.getElementById('end-shift-btn');
    const logStopBtn = document.getElementById('log-stop-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const paceDisplay = document.getElementById('pace-display');
    const totalStopsDisplay = document.getElementById('total-stops-display');
    const timeDisplay = document.getElementById('time-display');
    const targetPaceInput = document.getElementById('target-pace-input');

    // State Variables
    let totalStops = 0;
    let shiftStartTime = null;
    let timerInterval = null;

    // --- Initialization ---
    function init() {
        loadState();
        
        if (shiftStartTime) {
            // Shift is active
            showDashboard();
            startTimer();
            updateMetrics();
        } else {
            // No active shift
            showStartScreen();
        }
    }

    // --- Core Actions ---
    startShiftBtn.addEventListener('click', () => {
        shiftStartTime = Date.now();
        totalStops = 0;
        saveState();
        showDashboard();
        startTimer();
        updateMetrics();
    });

    logStopBtn.addEventListener('click', () => {
        totalStops++;
        saveState();
        updateMetrics();
        
        // Haptic feedback (vibrate phone if supported)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Visual feedback
        logStopBtn.style.transform = "scale(0.95)";
        setTimeout(() => {
            logStopBtn.style.transform = "";
        }, 100);
    });

    endShiftBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to end your shift?")) {
            stopTimer();
            alert(`Shift Ended!\nTotal Stops: ${totalStops}\nFinal Pace: ${paceDisplay.innerText} stops/hr`);
            clearState();
            showStartScreen();
        }
    });

    resetBtn.addEventListener('click', () => {
        if (confirm("Clear all data and reset?")) {
            stopTimer();
            clearState();
            showStartScreen();
        }
    });

    targetPaceInput.addEventListener('change', () => {
        localStorage.setItem('targetPace', targetPaceInput.value);
        updateMetrics();
    });

    // --- Timer & Metrics Logic ---
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        
        // Update every second
        timerInterval = setInterval(() => {
            updateMetrics();
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
    }

    function updateMetrics() {
        if (!shiftStartTime) return;

        const now = Date.now();
        const elapsedMs = now - shiftStartTime;
        
        // Format Time (HH:MM:SS)
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            timeDisplay.innerText = `${hours}:${pad(minutes)}:${pad(seconds)}`;
        } else {
            timeDisplay.innerText = `${pad(minutes)}:${pad(seconds)}`;
        }

        // Calculate Pace (Stops per Hour)
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        let currentPace = 0;
        if (elapsedHours > 0) {
            currentPace = (totalStops / elapsedHours).toFixed(1);
        }

        paceDisplay.innerText = currentPace;
        totalStopsDisplay.innerText = totalStops;

        // Visual feedback based on Target Pace
        const targetPace = parseFloat(targetPaceInput.value) || 25;
        const paceCard = paceDisplay.parentElement;
        
        // Only show red if they've been working for at least 5 minutes and are behind pace
        if (elapsedHours > 0.08) {
            if (parseFloat(currentPace) >= targetPace) {
                paceDisplay.style.color = "var(--success)"; // Green
            } else {
                paceDisplay.style.color = "var(--danger)"; // Red
            }
        } else {
            paceDisplay.style.color = "var(--amazon-orange)";
        }
    }

    function pad(num) {
        return num.toString().padStart(2, '0');
    }

    // --- UI State Management ---
    function showStartScreen() {
        shiftControls.style.display = 'flex';
        activeDashboard.style.display = 'none';
        paceDisplay.innerText = "0.0";
        totalStopsDisplay.innerText = "0";
        timeDisplay.innerText = "00:00";
    }

    function showDashboard() {
        shiftControls.style.display = 'none';
        activeDashboard.style.display = 'block';
    }

    // --- Local Storage Management ---
    function saveState() {
        const state = {
            shiftStartTime,
            totalStops
        };
        localStorage.setItem('deliveryTrackerState', JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem('deliveryTrackerState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                shiftStartTime = state.shiftStartTime;
                totalStops = state.totalStops;
            } catch (e) {
                clearState();
            }
        }
        
        const savedTarget = localStorage.getItem('targetPace');
        if (savedTarget) {
            targetPaceInput.value = savedTarget;
        }
    }

    function clearState() {
        shiftStartTime = null;
        totalStops = 0;
        localStorage.removeItem('deliveryTrackerState');
    }

    // Boot up
    init();
});
