/**
 * Desktop PWA Timer Application
 * Supports:
 * 1. PWA Service Worker
 * 2. One-click Preset Launch & localStorage Persistence (Add/Delete)
 * 3. Custom Hours / Minutes / Seconds Timer Specification
 * 4. Web Audio API Synthesized Crystal Chime
 * 5. Background Tab Title Blinking & Web Notifications API Desktop Alert
 */

(() => {
  'use strict';

  const STORAGE_KEYS = {
    PRESETS: 'chronofocus_presets_en_v1',
    LAST_TIMER: 'chronofocus_last_timer_v1',
  };

  const DEFAULT_PRESETS = [
    { id: 'p-25m', name: 'Focus', seconds: 25 * 60 },
    { id: 'p-5m', name: 'Short Break', seconds: 5 * 60 },
    { id: 'p-15m', name: 'Sprint', seconds: 15 * 60 },
    { id: 'p-3m', name: 'Tea / Ramen', seconds: 3 * 60 },
    { id: 'p-1m', name: 'Stretch', seconds: 60 },
    { id: 'p-10s', name: 'Test (10s)', seconds: 10 },
  ];

  // --- Application State ---
  let presets = [];
  let totalSeconds = 25 * 60;
  let remainingMs = totalSeconds * 1000;
  let targetEndTime = null;
  let isRunning = false;
  let isAlarmRinging = false;
  let activePresetId = 'p-25m';
  let activeTimerTitle = 'Focus';

  let tickTimerId = null;
  let titleBlinkTimerId = null;
  let alarmRepeatTimerId = null;
  let titleBlinkToggle = false;
  const baseDocumentTitle = 'Timer';

  let audioCtx = null;

  // --- DOM Elements ---
  const dom = {
    timeDisplay: document.getElementById('time-display'),
    totalDurationSub: document.getElementById('total-duration-sub'),
    activeTimerLabel: document.getElementById('active-timer-label'),
    finishTimeEstimate: document.getElementById('finish-time-estimate'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    startStopBtn: document.getElementById('start-stop-btn'),
    startStopLabel: document.getElementById('start-stop-label'),
    playStopIcon: document.getElementById('play-stop-icon'),
    presetGrid: document.getElementById('preset-grid'),
    addPresetForm: document.getElementById('add-preset-form'),
    presetNameInput: document.getElementById('preset-name-input'),
    presetMinInput: document.getElementById('preset-min-input'),
    presetSecInput: document.getElementById('preset-sec-input'),
    customTimerForm: document.getElementById('custom-timer-form'),
    customHours: document.getElementById('custom-hours'),
    customMinutes: document.getElementById('custom-minutes'),
    customSeconds: document.getElementById('custom-seconds'),
    customSetOnlyBtn: document.getElementById('custom-set-only-btn'),
    alarmBanner: document.getElementById('alarm-banner'),
    alarmBannerTitle: document.getElementById('alarm-banner-title'),
    alarmBannerDesc: document.getElementById('alarm-banner-desc'),
    stopAlarmBtn: document.getElementById('stop-alarm-btn'),
    notifyPermBtn: document.getElementById('notify-perm-btn'),
    notifyDot: document.getElementById('notify-dot'),
    notifyLabel: document.getElementById('notify-label'),
  };

  // --- Audio Synthesis via Web Audio API (Crystal Chime) ---
  function ensureAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playNote(ctx, freq, startTime, duration, type = 'sine', peakGain = 0.22) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function playAlarmPattern() {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Clear harmonic crystal chime (C5 - E5 - G5 - B5 - C6)
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((freq, idx) => {
      playNote(ctx, freq, now + idx * 0.13, 0.75, 'triangle', 0.22);
      playNote(ctx, freq * 2, now + idx * 0.13, 0.45, 'sine', 0.07);
    });
  }

  function playClickTick() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    playNote(ctx, 880, ctx.currentTime, 0.04, 'sine', 0.05);
  }

  // --- Formatting Helpers ---
  function formatTimeMs(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  function formatEnglishDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
  }

  function formatPresetButtonTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    }
    return `${m}:${pad(s)}`;
  }

  // --- Visual Updates ---
  function updateDisplay() {
    const formatted = formatTimeMs(remainingMs);
    dom.timeDisplay.textContent = formatted;
    dom.timeDisplay.classList.toggle('long-format', formatted.length > 5);

    dom.totalDurationSub.textContent = `Total: ${formatEnglishDuration(totalSeconds)}`;

    // Compact horizontal progress bar
    const totalMs = Math.max(1, totalSeconds * 1000);
    const ratio = Math.min(1, Math.max(0, remainingMs / totalMs));
    if (dom.progressBarFill) {
      dom.progressBarFill.style.width = `${(ratio * 100).toFixed(2)}%`;
    }

    // Status Tag & Finish Time
    if (isAlarmRinging) {
      dom.activeTimerLabel.textContent = `🔔 Time's Up (${activeTimerTitle})`;
      dom.activeTimerLabel.className = 'timer-tag alarm';
      dom.finishTimeEstimate.textContent = 'Completed';
    } else if (isRunning) {
      dom.activeTimerLabel.textContent = `▶ Running: ${activeTimerTitle}`;
      dom.activeTimerLabel.className = 'timer-tag running';
      if (targetEndTime) {
        const endDate = new Date(targetEndTime);
        const hh = String(endDate.getHours()).padStart(2, '0');
        const mm = String(endDate.getMinutes()).padStart(2, '0');
        const ss = String(endDate.getSeconds()).padStart(2, '0');
        dom.finishTimeEstimate.textContent = `Ends ${hh}:${mm}:${ss}`;
      }
      document.title = `(${formatted}) ${activeTimerTitle} — ${baseDocumentTitle}`;
    } else {
      dom.activeTimerLabel.textContent = `Standby: ${activeTimerTitle}`;
      dom.activeTimerLabel.className = 'timer-tag';
      dom.finishTimeEstimate.textContent = 'Ends --:--';
      if (!isAlarmRinging) {
        document.title = baseDocumentTitle;
      }
    }

    // Unified Display Button appearance (Click to Start / Stop)
    if (isRunning || isAlarmRinging) {
      dom.startStopLabel.textContent = 'Click to Stop';
      dom.startStopBtn.classList.add('stop-state');
      dom.playStopIcon.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2"></rect>';
    } else {
      dom.startStopLabel.textContent = 'Click to Start';
      dom.startStopBtn.classList.remove('stop-state');
      dom.playStopIcon.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"></polygon>';
    }
  }

  // --- Timer Engine (Drift-Free via Date.now()) ---
  function saveLastTimerState() {
    try {
      localStorage.setItem(
        STORAGE_KEYS.LAST_TIMER,
        JSON.stringify({
          seconds: totalSeconds,
          title: activeTimerTitle,
          presetId: activePresetId,
        })
      );
    } catch (_) {
      // ignore storage error
    }
  }

  function loadLastTimerState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LAST_TIMER);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.seconds === 'number' && parsed.seconds > 0) {
        totalSeconds = parsed.seconds;
        remainingMs = parsed.seconds * 1000;
        activeTimerTitle = parsed.title || 'Timer';
        activePresetId = parsed.presetId || null;
      }
    } catch (_) {
      // ignore storage error
    }
  }

  function startTimer() {
    stopAlarmEffects();
    ensureAudioContext();

    remainingMs = totalSeconds * 1000;
    if (remainingMs <= 0) return;

    saveLastTimerState();
    isRunning = true;
    targetEndTime = Date.now() + remainingMs;
    playClickTick();

    clearInterval(tickTimerId);
    tickTimerId = setInterval(onTick, 100);
    updateDisplay();
  }

  function stopTimer() {
    stopAlarmEffects();
    isRunning = false;
    targetEndTime = null;
    clearInterval(tickTimerId);
    tickTimerId = null;
    remainingMs = totalSeconds * 1000;
    updateDisplay();
  }

  function setAndStartTimer(seconds, title = 'Custom', presetId = null) {
    if (seconds <= 0) return;
    stopAlarmEffects();
    clearInterval(tickTimerId);

    totalSeconds = seconds;
    remainingMs = seconds * 1000;
    activeTimerTitle = title;
    activePresetId = presetId;

    renderPresets();
    startTimer();
  }

  function setTimerWithoutStarting(seconds, title = 'Custom', presetId = null) {
    if (seconds <= 0) return;
    stopAlarmEffects();
    clearInterval(tickTimerId);
    isRunning = false;
    targetEndTime = null;

    totalSeconds = seconds;
    remainingMs = seconds * 1000;
    activeTimerTitle = title;
    activePresetId = presetId;

    renderPresets();
    updateDisplay();
  }

  function onTick() {
    if (!isRunning || !targetEndTime) return;
    const now = Date.now();
    remainingMs = Math.max(0, targetEndTime - now);
    updateDisplay();

    if (remainingMs <= 0) {
      triggerTimeUp();
    }
  }

  // --- Alarm & Background Notifications ---
  function triggerTimeUp() {
    isRunning = false;
    targetEndTime = null;
    clearInterval(tickTimerId);
    tickTimerId = null;
    remainingMs = 0;
    isAlarmRinging = true;

    document.body.classList.add('alarm-ringing');
    if (dom.startStopBtn) dom.startStopBtn.classList.add('alarm-mode');
    dom.alarmBanner.classList.remove('hidden');
    dom.alarmBannerTitle.textContent = `Time's up for "${activeTimerTitle}"!`;
    dom.alarmBannerDesc.textContent = `${formatEnglishDuration(totalSeconds)} has elapsed.`;

    updateDisplay();

    // 1. Play Web Audio Chime Immediately & Repeat Every 2.8s until stopped
    playAlarmPattern();
    clearInterval(alarmRepeatTimerId);
    alarmRepeatTimerId = setInterval(() => {
      playAlarmPattern();
    }, 2800);

    // 2. Blink Document Tab Title for Background Awareness
    clearInterval(titleBlinkTimerId);
    titleBlinkToggle = false;
    titleBlinkTimerId = setInterval(() => {
      titleBlinkToggle = !titleBlinkToggle;
      document.title = titleBlinkToggle
        ? `🔔 [TIME'S UP!] ${activeTimerTitle}`
        : `⏰ 00:00 — ${activeTimerTitle}`;
    }, 750);

    // 3. Fire Desktop Notification (Web Notifications API)
    sendDesktopNotification();
  }

  function stopAlarmEffects() {
    if (!isAlarmRinging && !titleBlinkTimerId && !alarmRepeatTimerId) return;
    isAlarmRinging = false;

    clearInterval(alarmRepeatTimerId);
    alarmRepeatTimerId = null;

    clearInterval(titleBlinkTimerId);
    titleBlinkTimerId = null;

    document.body.classList.remove('alarm-ringing');
    if (dom.startStopBtn) dom.startStopBtn.classList.remove('alarm-mode');
    dom.alarmBanner.classList.add('hidden');
    document.title = baseDocumentTitle;

    if (remainingMs <= 0) {
      remainingMs = totalSeconds * 1000;
    }
    updateDisplay();
  }

  function sendDesktopNotification() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const title = `🔔 Time's Up: ${activeTimerTitle}`;
    const options = {
      body: `Your ${formatEnglishDuration(totalSeconds)} timer has finished.`,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'chronofocus-timer-complete',
      renotify: true,
      requireInteraction: true,
    };

    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, options);
        });
      } else {
        const n = new Notification(title, options);
        n.onclick = () => {
          window.focus();
          stopAlarmEffects();
          n.close();
        };
      }
    } catch (_) {
      // Fallback for environments restricting Notification constructor
    }
  }

  function updateNotificationPermUI() {
    if (!('Notification' in window)) {
      dom.notifyLabel.textContent = 'Alerts N/A';
      dom.notifyDot.className = 'status-dot denied';
      return;
    }
    const perm = Notification.permission;
    if (perm === 'granted') {
      dom.notifyLabel.textContent = 'Alerts: On';
      dom.notifyDot.className = 'status-dot granted';
    } else if (perm === 'denied') {
      dom.notifyLabel.textContent = 'Alerts: Blocked';
      dom.notifyDot.className = 'status-dot denied';
    } else {
      dom.notifyLabel.textContent = 'Enable Alerts';
      dom.notifyDot.className = 'status-dot';
    }
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification('Desktop Alerts Active', {
        body: 'You will be notified when the timer finishes in the background.',
        icon: './icons/icon-192.png',
      });
      return;
    }
    const result = await Notification.requestPermission();
    updateNotificationPermUI();
    if (result === 'granted') {
      new Notification('Desktop Alerts Enabled', {
        body: 'You will be notified when the timer finishes.',
        icon: './icons/icon-192.png',
      });
    }
  }

  // --- Presets Management (localStorage) ---
  function loadPresets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          presets = parsed;
          return;
        }
      }
    } catch (_) {
      // ignore storage error
    }
    presets = [...DEFAULT_PRESETS];
    savePresets();
  }

  function savePresets() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch (_) {
      // ignore storage error
    }
  }

  function renderPresets() {
    dom.presetGrid.innerHTML = '';

    presets.forEach((preset) => {
      const card = document.createElement('div');
      card.className = 'preset-item' + (preset.id === activePresetId ? ' active-preset' : '');

      const launchBtn = document.createElement('button');
      launchBtn.type = 'button';
      launchBtn.className = 'preset-trigger-btn';
      launchBtn.title = `Click to start "${preset.name}" immediately`;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'preset-item-name';
      nameSpan.textContent = preset.name;

      const timeSpan = document.createElement('span');
      timeSpan.className = 'preset-item-time';
      timeSpan.innerHTML = `${formatPresetButtonTime(preset.seconds)} <span class="preset-play-badge">▶</span>`;

      launchBtn.appendChild(nameSpan);
      launchBtn.appendChild(timeSpan);

      // 1-Click Immediate Start Requirement
      launchBtn.addEventListener('click', () => {
        setAndStartTimer(preset.seconds, preset.name, preset.id);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'preset-delete-btn';
      deleteBtn.title = `Delete "${preset.name}"`;
      deleteBtn.setAttribute('aria-label', `Delete ${preset.name}`);
      deleteBtn.textContent = '✕';

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deletePreset(preset.id);
      });

      card.appendChild(launchBtn);
      card.appendChild(deleteBtn);
      dom.presetGrid.appendChild(card);
    });
  }

  function addPreset(name, minutes, seconds) {
    const totalSec = Math.max(0, Math.floor(minutes * 60 + seconds));
    if (totalSec <= 0) return;

    const cleanName = name.trim() || `${formatEnglishDuration(totalSec)} Timer`;
    const newPreset = {
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: cleanName,
      seconds: totalSec,
    };

    presets.push(newPreset);
    savePresets();
    renderPresets();
  }

  function deletePreset(id) {
    presets = presets.filter((p) => p.id !== id);
    savePresets();
    if (activePresetId === id) {
      activePresetId = null;
    }
    renderPresets();
  }

  // --- Event Listeners ---
  function bindEvents() {
    // Start / Stop
    dom.startStopBtn.addEventListener('click', () => {
      if (isAlarmRinging) {
        stopAlarmEffects();
        return;
      }
      if (isRunning) {
        stopTimer();
      } else {
        startTimer();
      }
    });

    // Stop Alarm Banner Button
    dom.stopAlarmBtn.addEventListener('click', () => {
      stopAlarmEffects();
    });

    // Quick +/- Time Adjustment Chips
    document.querySelectorAll('[data-add-seconds]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const deltaSec = Number(btn.getAttribute('data-add-seconds') || 0);
        const deltaMs = deltaSec * 1000;
        if (isAlarmRinging) stopAlarmEffects();

        if (isRunning && targetEndTime) {
          targetEndTime = Math.max(Date.now() + 1000, targetEndTime + deltaMs);
          remainingMs = Math.max(1000, targetEndTime - Date.now());
          totalSeconds = Math.max(totalSeconds, Math.ceil(remainingMs / 1000));
          saveLastTimerState();
        } else {
          const nextSec = Math.max(5, Math.ceil(remainingMs / 1000) + deltaSec);
          totalSeconds = nextSec;
          remainingMs = nextSec * 1000;
        }
        updateDisplay();
      });
    });

    // Add Preset Form
    dom.addPresetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = dom.presetNameInput.value;
      const mins = Number(dom.presetMinInput.value) || 0;
      const secs = Number(dom.presetSecInput.value) || 0;
      if (mins === 0 && secs === 0) return;

      addPreset(name, mins, secs);
      dom.presetNameInput.value = '';
    });

    // Custom H:M:S Form
    dom.customTimerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const h = Math.max(0, Number(dom.customHours.value) || 0);
      const m = Math.max(0, Number(dom.customMinutes.value) || 0);
      const s = Math.max(0, Number(dom.customSeconds.value) || 0);
      const total = h * 3600 + m * 60 + s;
      if (total <= 0) return;

      setAndStartTimer(total, `Custom (${formatEnglishDuration(total)})`, null);
    });

    dom.customSetOnlyBtn.addEventListener('click', () => {
      const h = Math.max(0, Number(dom.customHours.value) || 0);
      const m = Math.max(0, Number(dom.customMinutes.value) || 0);
      const s = Math.max(0, Number(dom.customSeconds.value) || 0);
      const total = h * 3600 + m * 60 + s;
      if (total <= 0) return;

      setTimerWithoutStarting(total, `Custom (${formatEnglishDuration(total)})`, null);
    });

    // Desktop Notification Permission
    dom.notifyPermBtn.addEventListener('click', () => {
      requestNotificationPermission();
    });

    // Keyboard Shortcuts (Space: Start/Stop/StopAlarm, Esc: Stop)
    window.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isAlarmRinging) {
          stopAlarmEffects();
        } else if (isRunning) {
          stopTimer();
        } else {
          startTimer();
        }
      } else if (e.key === 'Escape') {
        if (isAlarmRinging) {
          stopAlarmEffects();
        } else if (isRunning) {
          stopTimer();
        }
      }
    });
  }

  // --- Register Service Worker ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(() => {
          // Service worker registration optional on file:// protocol
        });
      });
    }
  }

  // --- Init ---
  function init() {
    loadPresets();
    loadLastTimerState();
    renderPresets();
    updateNotificationPermUI();
    updateDisplay();
    bindEvents();
    registerServiceWorker();
  }

  init();
})();
