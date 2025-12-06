import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import timerEndChimeUrl from '../assets/timer-end.mp3';

const BEEP_DURATION_MS = 700;
const BEEP_FREQUENCY = 880;

let cachedAudio: HTMLAudioElement | null = null;

function playFallbackBeep() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    const primary = ctx.createOscillator();
    const overtone = ctx.createOscillator();

    primary.type = 'sine';
    primary.frequency.value = BEEP_FREQUENCY;

    overtone.type = 'sine';
    overtone.frequency.value = BEEP_FREQUENCY * 1.5;

    primary.connect(gain);
    overtone.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const end = now + BEEP_DURATION_MS / 1000;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    primary.start(now);
    overtone.start(now);
    primary.stop(end);
    overtone.stop(end);
  } catch {
    // Fail silently if AudioContext is unavailable.
  }
}

function playBeep() {
  try {
    if (typeof Audio !== 'undefined') {
      if (!cachedAudio) {
        cachedAudio = new Audio(timerEndChimeUrl);
      }
      cachedAudio.currentTime = 0;
      void cachedAudio.play().catch(() => {
        playFallbackBeep();
      });
      return;
    }
  } catch {
    // Fall back to synthesized beep below.
  }

  playFallbackBeep();
}

export function usePomodoroEngine() {
  const timerStatus = useAppStore((state) => state.timer.status);

  useEffect(() => {
    if (timerStatus !== 'running') return undefined;

    const intervalId = window.setInterval(() => {
      const state = useAppStore.getState();
      if (state.timer.status !== 'running') return;

      const prevStatus = state.timer.status;
      state.tick();

      const nextState = useAppStore.getState();
      const becameIdle = prevStatus === 'running' && nextState.timer.status === 'idle';
      if (becameIdle && nextState.preferences.soundEnabled) {
        playBeep();
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timerStatus]);
}
