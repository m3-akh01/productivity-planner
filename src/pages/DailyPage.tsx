import { useEffect, useState, useMemo } from 'react';
import { toDateKey, getLocalTodayKey } from '../core/date';
import { getQuoteForDate } from '../core/quotes';
import { getGreeting } from '../core/greetings';
import {
  mitHelpBullets,
  taskWritingHelpBullets,
  pomodoroHelpBullets,
  timeTrackingHelpBullets,
  productivityScoreHelpBullets,
} from '../core/helpContent';
import { useAppStore } from '../store/appStore';
import { HelpPopover, PomodoroBubbles } from '../components';
import styles from './DailyPage.module.css';

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalTodayKey());

  const name = useAppStore((state) => state.onboarding.name);
  const preferences = useAppStore((state) => state.preferences);
  const timer = useAppStore((state) => state.timer);
  const daily = useAppStore((state) => state.daily);
  const ensureDailyEntry = useAppStore((state) => state.ensureDailyEntry);
  const setTaskText = useAppStore((state) => state.setTaskText);
  const setTaskTarget = useAppStore((state) => state.setTaskTarget);
  const setTaskDone = useAppStore((state) => state.setTaskDone);
  const setTaskPomodorosActual = useAppStore((state) => state.setTaskPomodorosActual);
  const incrementTaskPomodoro = useAppStore((state) => state.incrementTaskPomodoro);
  const decrementTaskPomodoro = useAppStore((state) => state.decrementTaskPomodoro);
  const setNotes = useAppStore((state) => state.setNotes);
  const setProductivityScore = useAppStore((state) => state.setProductivityScore);
  const setProductivityReflection = useAppStore((state) => state.setProductivityReflection);
  const startWorkOnTask = useAppStore((state) => state.startWorkOnTask);
  const pauseTimer = useAppStore((state) => state.pause);
  const resumeTimer = useAppStore((state) => state.resume);
  const canInteractWithTask = useAppStore((state) => state.canInteractWithTask);

  const todayKey = getLocalTodayKey();
  const isToday = selectedDate === todayKey;

  // Ensure entry exists
  useEffect(() => {
    ensureDailyEntry(selectedDate);
  }, [ensureDailyEntry, selectedDate]);

  const entry = daily[selectedDate];
  const tasks = entry?.tasks ?? [];
  const score = entry?.productivityScore ?? 5;

  // Date navigation
  const navigateDay = (delta: number) => {
    const current = new Date(`${selectedDate}T00:00:00`);
    current.setDate(current.getDate() + delta);
    setSelectedDate(toDateKey(current));
  };

  // Format date for display
  const displayDate = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate]);

  // Quote for the selected date
  const quote = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    return getQuoteForDate(d);
  }, [selectedDate]);

  // Greeting (only for today)
  const greeting = isToday ? getGreeting(name || 'friend') : null;

  // Check task interaction
  const getTaskInteraction = (idx: number) => {
    return canInteractWithTask(selectedDate, idx);
  };

  // Handle score change
  const handleScoreChange = (value: number | null) => {
    setProductivityScore(selectedDate, value);
  };

  const clampScore = (v: number) => Math.min(10, Math.max(1, Math.round(v)));

  const scoreToSliderValue = (s: number): number => {
    const clamped = clampScore(s);
    if (clamped <= 5) {
      // Map 1-5 -> 0-5 so that 5 ends up at center
      return (clamped - 1) * (5 / 4);
    }
    // 5-10 map directly to 5-10
    return clamped;
  };

  const sliderValueToScore = (val: number): number => {
    const v = Math.max(0, Math.min(10, val));
    if (v <= 5) {
      // Inverse of the 1-5 segment
      const s = 1 + (4 / 5) * v;
      return clampScore(s);
    }
    return clampScore(v);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={`${styles.header} animate-fade-up`}>
        <div className={styles.headerLeft}>
          {greeting && <h1 className={styles.greeting}>{greeting}</h1>}
          {!greeting && <h1 className={styles.greeting}>Daily Planner</h1>}
        </div>
        <div className={styles.dateNav}>
          <button
            className={styles.navBtn}
            onClick={() => navigateDay(-1)}
            aria-label="Previous day"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div
            className={`${styles.dateDisplay} ${isToday ? styles.dateDisplayCurrent : ''}`}
          >
            <span className={styles.dateText}>{displayDate}</span>
            <input
              type="date"
              className={styles.datePicker}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Select date"
            />
          </div>
          <button
            className={styles.navBtn}
            onClick={() => navigateDay(1)}
            aria-label="Next day"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </header>

      {/* Quote */}
      <section className={`${styles.quote} animate-stagger animate-fade-up delay-1`}>
        <div className={styles.quoteContent}>
          <blockquote className={styles.quoteText}>"{quote.text}"</blockquote>
          {quote.author && <cite className={styles.quoteAuthor}>— {quote.author}</cite>}
        </div>
      </section>

      {/* MIT Card (Task 1) */}
      <section className={`${styles.mitCard} animate-stagger animate-fade-up delay-2`}>
        <div className={styles.mitHeader}>
          <div className={styles.mitTitleRow}>
            <h2 className={styles.mitTitle}>Most Important Task</h2>
            <HelpPopover title="MIT Guidance" bullets={mitHelpBullets} />
          </div>
          <p className={styles.mitSubtitle}>
            If this was the only thing you did today, you'd be satisfied.
          </p>
        </div>
        <TaskCard
          task={tasks[0]}
          index={0}
          date={selectedDate}
          isMIT
          interaction={getTaskInteraction(0)}
          onTextChange={(text) => setTaskText(selectedDate, 0, text)}
          onTargetChange={(target) => setTaskTarget(selectedDate, 0, target)}
          onActualChange={(actual) => setTaskPomodorosActual(selectedDate, 0, actual)}
          onIncrement={() => incrementTaskPomodoro(selectedDate, 0)}
          onDecrement={() => decrementTaskPomodoro(selectedDate, 0)}
          onDoneChange={(done) => setTaskDone(selectedDate, 0, done)}
          onStartTimer={() => startWorkOnTask(selectedDate, 0)}
          timerActiveOnThis={timer.activeTaskRef?.date === selectedDate && timer.activeTaskRef?.taskIndex === 0}
          timerStatus={timer.status}
          onPause={pauseTimer}
          onResume={resumeTimer}
        />
      </section>

      {/* Secondary Tasks (Task 2-3) */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-3`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Secondary Tasks</h3>
          <HelpPopover title="Task Writing Tips" bullets={taskWritingHelpBullets} />
        </div>
        <div className={styles.taskList}>
          {[1, 2].map((idx) => (
            <TaskCard
              key={idx}
              task={tasks[idx]}
              index={idx}
              date={selectedDate}
              interaction={getTaskInteraction(idx)}
              onTextChange={(text) => setTaskText(selectedDate, idx, text)}
              onTargetChange={(target) => setTaskTarget(selectedDate, idx, target)}
              onActualChange={(actual) => setTaskPomodorosActual(selectedDate, idx, actual)}
              onIncrement={() => incrementTaskPomodoro(selectedDate, idx)}
              onDecrement={() => decrementTaskPomodoro(selectedDate, idx)}
              onDoneChange={(done) => setTaskDone(selectedDate, idx, done)}
              onStartTimer={() => startWorkOnTask(selectedDate, idx)}
              timerActiveOnThis={timer.activeTaskRef?.date === selectedDate && timer.activeTaskRef?.taskIndex === idx}
              timerStatus={timer.status}
              onPause={pauseTimer}
              onResume={resumeTimer}
            />
          ))}
        </div>
      </section>

      {/* Additional Tasks (Task 4-5) */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-4`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Additional Tasks</h3>
        </div>
        <div className={styles.taskList}>
          {[3, 4].map((idx) => (
            <TaskCard
              key={idx}
              task={tasks[idx]}
              index={idx}
              date={selectedDate}
              interaction={getTaskInteraction(idx)}
              onTextChange={(text) => setTaskText(selectedDate, idx, text)}
              onTargetChange={(target) => setTaskTarget(selectedDate, idx, target)}
              onActualChange={(actual) => setTaskPomodorosActual(selectedDate, idx, actual)}
              onIncrement={() => incrementTaskPomodoro(selectedDate, idx)}
              onDecrement={() => decrementTaskPomodoro(selectedDate, idx)}
              onDoneChange={(done) => setTaskDone(selectedDate, idx, done)}
              onStartTimer={() => startWorkOnTask(selectedDate, idx)}
              timerActiveOnThis={timer.activeTaskRef?.date === selectedDate && timer.activeTaskRef?.taskIndex === idx}
              timerStatus={timer.status}
              onPause={pauseTimer}
              onResume={resumeTimer}
            />
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-5`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Notes</h3>
        </div>
        <textarea
          className={styles.notesInput}
          value={entry?.notes ?? ''}
          onChange={(e) => setNotes(selectedDate, e.target.value)}
          placeholder="Capture thoughts, blockers, wins..."
          rows={4}
        />
      </section>

      {/* Productivity Score */}
      <section className={`${styles.section} ${styles.scoreSection} animate-stagger animate-fade-up delay-5`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Productivity Score</h3>
          <HelpPopover title="Scoring Guidance" bullets={productivityScoreHelpBullets} />
        </div>
        <div className={styles.scoreCard}>
          <div className={styles.scoreSlider}>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={scoreToSliderValue(score)}
              onChange={(e) => handleScoreChange(sliderValueToScore(Number(e.target.value)))}
              className={styles.rangeInput}
            />
            <div className={styles.scoreLabels}>
              <span>1</span>
              <span>10</span>
            </div>
          </div>
          <div className={styles.scoreDisplay}>
            <span className={styles.scoreValue}>{score}</span>
          </div>
        </div>
        <input
          type="text"
          className={styles.reflectionInput}
          value={entry?.productivityReflection ?? ''}
          onChange={(e) => setProductivityReflection(selectedDate, e.target.value)}
          placeholder="What happened? What helped or hurt?"
        />
      </section>
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task?: {
    text: string;
    targetPomodoros?: number | null;
    actualPomodoros: number;
    done: boolean;
  };
  index: number;
  date: string;
  isMIT?: boolean;
  interaction: { canStartTimer: boolean; canMarkDone: boolean; blockingReason?: string };
  onTextChange: (text: string) => void;
  onTargetChange: (target: number | null) => void;
  onActualChange: (actual: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onDoneChange: (done: boolean) => void;
  onStartTimer: () => void;
  timerActiveOnThis: boolean;
  timerStatus: 'idle' | 'running' | 'paused';
  onPause: () => void;
  onResume: () => void;
}

function TaskCard({
  task,
  index,
  isMIT,
  interaction,
  onTextChange,
  onTargetChange,
  onActualChange,
  onIncrement,
  onDecrement,
  onDoneChange,
  onStartTimer,
  timerActiveOnThis,
  timerStatus,
  onPause,
  onResume,
}: TaskCardProps) {
  const text = task?.text ?? '';
  const target = task?.targetPomodoros ?? 1;
  const actual = task?.actualPomodoros ?? 0;
  const done = task?.done ?? false;

  const isBlocked = !interaction.canStartTimer;
  const targetValue = Math.max(1, Math.round(target || 1));
  const maxTarget = 50;
  const isActive = timerActiveOnThis;
  const isRunning = isActive && timerStatus === 'running';
  const isPaused = isActive && timerStatus === 'paused';

  const handleTimerClick = () => {
    if (isActive) {
      if (isRunning) {
        onPause();
        return;
      }
      if (isPaused) {
        onResume();
        return;
      }
    }
    onStartTimer();
  };

  return (
    <div className={`${styles.taskCard} ${isMIT ? styles.taskCardMIT : ''} ${done ? styles.taskCardDone : ''} ${isBlocked ? styles.taskCardBlocked : ''}`}>
      <div className={styles.taskMain}>
        {/* Task number & checkbox */}
        <div className={styles.taskCheck}>
          <span className={styles.taskNumber}>{index + 1}</span>
          <button
            className={`${styles.checkbox} ${done ? styles.checkboxChecked : ''}`}
            onClick={() => onDoneChange(!done)}
            disabled={isBlocked && !done}
            title={isBlocked && !done ? interaction.blockingReason : done ? 'Mark incomplete' : 'Mark complete'}
            aria-pressed={done}
          >
            {done && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 12l5 5L20 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Task text */}
        <div className={styles.taskContent}>
          {isMIT ? (
            <textarea
              className={styles.mitInput}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="What's the most important thing to accomplish?"
              rows={2}
            />
          ) : (
            <textarea
              className={styles.taskInput}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={`Task ${index + 1}...`}
              rows={3}
            />
          )}
        </div>
      </div>

      {/* Pomodoro row */}
      <div className={styles.taskPomodoro}>
        <div className={styles.pomodoroControls}>
          {/* Target */}
          <div className={styles.pomodoroField}>
            <label className={styles.pomodoroLabel}>Target</label>
            <div className={styles.stepper}>
              <button
                className={styles.stepBtn}
                onClick={() => onTargetChange(Math.max(1, targetValue - 1))}
                disabled={targetValue <= 1}
                aria-label="Decrease target"
              >
                −
              </button>
              <span className={styles.stepperValue}>{targetValue}</span>
              <button
                className={styles.stepBtn}
                onClick={() => onTargetChange(Math.min(maxTarget, targetValue + 1))}
                aria-label="Increase target"
              >
                +
              </button>
            </div>
          </div>

          {/* Actual with +/- */}
          <div className={styles.pomodoroField}>
            <label className={styles.pomodoroLabel}>Actual</label>
            <div className={styles.stepper}>
              <button
                className={styles.stepBtn}
                onClick={onDecrement}
                disabled={actual === 0}
                aria-label="Decrease"
              >
                −
              </button>
              <span className={styles.stepperValue}>{actual}</span>
              <button
                className={styles.stepBtn}
                onClick={onIncrement}
                aria-label="Increase"
              >
                +
              </button>
            </div>
          </div>

          {/* Timer button */}
          <button
            className={`${styles.timerBtn} ${isRunning ? styles.timerActive : ''}`}
            onClick={handleTimerClick}
            disabled={isBlocked}
            title={
              isBlocked
                ? interaction.blockingReason
                : isRunning
                  ? 'Pause timer'
                  : isPaused
                    ? 'Resume timer'
                    : 'Start timer'
            }
          >
            {isRunning ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1" fill="white" />
                <rect x="14" y="4" width="4" height="16" rx="1" fill="white" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" fill="white" />
              </svg>
            )}
          </button>
        </div>

        {/* Bubbles */}
        <div className={styles.bubblesRow}>
          <PomodoroBubbles filled={actual} target={targetValue} size="medium" />
        </div>
      </div>

      {/* Blocked indicator */}
      {isBlocked && (
        <div className={styles.blockedBadge} title={interaction.blockingReason}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Complete earlier tasks first</span>
        </div>
      )}
    </div>
  );
}
