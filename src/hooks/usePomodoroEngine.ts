import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

const BEEP_DURATION_MS = 160;
const BEEP_FREQUENCY = 880;

function playBeep() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = BEEP_FREQUENCY;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    const end = now + BEEP_DURATION_MS / 1000;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.start(now);
    oscillator.stop(end);
  } catch {
    // Fail silently if AudioContext is unavailable.
  }
}

export function usePomodoroEngine() {
  const timerStatus = useAppStore((state) => state.timer.status);

  useEffect(() => {
    if (timerStatus !== 'running') return undefined;

    const intervalId = window.setInterval(() => {
      const state = useAppStore.getState();
      if (state.timer.status !== 'running') return;
      const secondsRemaining = state.timer.endsAt
        ? Math.max(0, Math.ceil((state.timer.endsAt - Date.now()) / 1000))
        : state.timer.secondsLeft;
      const shouldBeep = secondsRemaining <= 1;
      state.tick();
      if (shouldBeep && useAppStore.getState().preferences.soundEnabled) {
        playBeep();
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timerStatus]);
}
