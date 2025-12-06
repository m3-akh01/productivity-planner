import { useEffect, useState, useMemo } from 'react';
import { getWeekKey, getStartOfWeek } from '../core/date';
import { useAppStore } from '../store/appStore';
import styles from './WeeklyPage.module.css';

export default function WeeklyPage() {
  const preferences = useAppStore((state) => state.preferences);
  const weekly = useAppStore((state) => state.weekly);
  const ensureWeeklyPlan = useAppStore((state) => state.ensureWeeklyPlan);
  const setWeeklyMostImportant = useAppStore((state) => state.setWeeklyMostImportant);
  const setWeeklySecondary = useAppStore((state) => state.setWeeklySecondary);
  const setWeeklyAdditional = useAppStore((state) => state.setWeeklyAdditional);
  const setWeeklyCommitment = useAppStore((state) => state.setWeeklyCommitment);

  // Track selected week (by its start date key)
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    return getWeekKey(new Date(), preferences.weekStartsOn);
  });

  // Ensure plan exists
  useEffect(() => {
    ensureWeeklyPlan(selectedWeekStart);
  }, [ensureWeeklyPlan, selectedWeekStart]);

  const plan = weekly[selectedWeekStart];

  // Current week key for comparison
  const currentWeekKey = useMemo(
    () => getWeekKey(new Date(), preferences.weekStartsOn),
    [preferences.weekStartsOn]
  );

  const isCurrentWeek = selectedWeekStart === currentWeekKey;

  // Navigate weeks
  const navigateWeek = (delta: number) => {
    const current = new Date(`${selectedWeekStart}T00:00:00`);
    current.setDate(current.getDate() + delta * 7);
    const newKey = getWeekKey(current, preferences.weekStartsOn);
    setSelectedWeekStart(newKey);
  };

  // Format week range for display
  const weekRange = useMemo(() => {
    const start = new Date(`${selectedWeekStart}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const formatDate = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${formatDate(start)} — ${formatDate(end)}`;
  }, [selectedWeekStart]);

  // Calculate progress
  const filledMostImportant = (plan?.mostImportant ?? []).filter((t) => t.trim()).length;
  const filledSecondary = (plan?.secondary ?? []).filter((t) => t.trim()).length;
  const filledAdditional = (plan?.additional ?? []).filter((t) => t.trim()).length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={`${styles.header} animate-fade-up`}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Weekly Plan</h1>
          <p className={styles.subtitle}>Map out your week's priorities</p>
        </div>
        <div className={styles.weekNav}>
          <button
            className={styles.navBtn}
            onClick={() => navigateWeek(-1)}
            aria-label="Previous week"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div
            className={`${styles.weekDisplay} ${
              isCurrentWeek ? styles.weekDisplayCurrent : ''
            }`}
          >
            <span className={styles.weekLabel}>Week of</span>
            <span className={styles.weekRange}>{weekRange}</span>
          </div>
          <button
            className={styles.navBtn}
            onClick={() => navigateWeek(1)}
            aria-label="Next week"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </header>

      {/* Most Important Tasks */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-1`}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.priorityBadge} ${styles.priorityHigh}`}>High Priority</div>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>Most Important Tasks</h2>
            <span className={styles.counter}>{filledMostImportant}/5</span>
          </div>
          <p className={styles.sectionDesc}>
            Your 5 non-negotiable tasks for the week. These must get done.
          </p>
        </div>
        <div className={styles.taskList}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <TaskRow
              key={idx}
              index={idx}
              value={plan?.mostImportant[idx] ?? ''}
              onChange={(text) => setWeeklyMostImportant(selectedWeekStart, idx, text)}
              placeholder={`Most important task ${idx + 1}...`}
              priority="high"
            />
          ))}
        </div>
      </section>

      {/* Secondary Tasks */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-2`}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.priorityBadge} ${styles.priorityMedium}`}>Medium Priority</div>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>Secondary Tasks</h2>
            <span className={styles.counter}>{filledSecondary}/6</span>
          </div>
          <p className={styles.sectionDesc}>
            Important tasks with flexible timing. Do these after completing high-priority items.
          </p>
        </div>
        <div className={styles.taskList}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <TaskRow
              key={idx}
              index={idx}
              value={plan?.secondary[idx] ?? ''}
              onChange={(text) => setWeeklySecondary(selectedWeekStart, idx, text)}
              placeholder={`Secondary task ${idx + 1}...`}
              priority="medium"
            />
          ))}
        </div>
      </section>

      {/* Additional Tasks */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-3`}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.priorityBadge} ${styles.priorityLow}`}>If Time Permits</div>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>Additional Tasks</h2>
            <span className={styles.counter}>{filledAdditional}/5</span>
          </div>
          <p className={styles.sectionDesc}>
            Nice to complete if you have extra time. Don't stress if these don't happen.
          </p>
        </div>
        <div className={styles.taskList}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <TaskRow
              key={idx}
              index={idx}
              value={plan?.additional[idx] ?? ''}
              onChange={(text) => setWeeklyAdditional(selectedWeekStart, idx, text)}
              placeholder={`Additional task ${idx + 1}...`}
              priority="low"
            />
          ))}
        </div>
      </section>

      {/* Weekly Commitment */}
      <section className={`${styles.commitment} animate-stagger animate-fade-up delay-4`}>
        <label className={styles.commitmentLabel}>Weekly Commitment</label>
        <p className={styles.commitmentDesc}>
          One sentence about how you'll show up this week.
        </p>
        <input
          type="text"
          className={styles.commitmentInput}
          value={plan?.commitment ?? ''}
          onChange={(e) => setWeeklyCommitment(selectedWeekStart, e.target.value)}
          placeholder="This week, I commit to..."
        />
      </section>
    </div>
  );
}

// Task Row Component
interface TaskRowProps {
  index: number;
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  priority: 'high' | 'medium' | 'low';
}

function TaskRow({ index, value, onChange, placeholder, priority }: TaskRowProps) {
  const filled = value.trim().length > 0;

  return (
    <div className={`${styles.taskRow} ${filled ? styles.taskRowFilled : ''}`}>
      <span
        className={`${styles.taskNumber} ${
          priority === 'high'
            ? styles.numberHigh
            : priority === 'medium'
            ? styles.numberMedium
            : styles.numberLow
        }`}
      >
        {index + 1}
      </span>
      <input
        type="text"
        className={styles.taskInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {filled && (
        <span className={styles.checkMark}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </span>
      )}
    </div>
  );
}
