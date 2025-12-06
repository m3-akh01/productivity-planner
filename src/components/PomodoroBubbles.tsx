import styles from './PomodoroBubbles.module.css';

interface PomodoroBubblesProps {
  filled: number;
  target?: number;
  max?: number;
  size?: 'small' | 'medium';
}

export function PomodoroBubbles({ filled, target = 1, max = 10, size = 'medium' }: PomodoroBubblesProps) {
  const safeTarget = Math.max(1, Math.round(target));
  const safeFilled = Math.max(0, Math.round(filled));
  const displayCount = Math.min(max, Math.max(safeTarget, safeFilled, 1));
  const bubbles = Array.from({ length: displayCount }, (_, i) => i < safeFilled);
  const targetOrFilled = Math.max(safeTarget, safeFilled);
  const overflow = targetOrFilled > displayCount ? targetOrFilled - displayCount : 0;

  return (
    <div className={`${styles.bubbles} ${size === 'small' ? styles.small : ''}`}>
      {bubbles.map((isFilled, idx) => (
        <div
          key={idx}
          className={`${styles.bubble} ${isFilled ? styles.filled : ''}`}
          aria-label={isFilled ? `Pomodoro ${idx + 1} completed` : `Pomodoro ${idx + 1} empty`}
        />
      ))}
      {overflow > 0 && (
        <span className={styles.overflow}>+{overflow}</span>
      )}
    </div>
  );
}

export default PomodoroBubbles;
