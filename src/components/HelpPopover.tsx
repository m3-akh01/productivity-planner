import { useState, useRef, useEffect } from 'react';
import styles from './HelpPopover.module.css';

interface HelpPopoverProps {
  title: string;
  bullets: string[];
}

export function HelpPopover({ title, bullets }: HelpPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);


  return (
    <div className={styles.container}>
      <button
        ref={buttonRef}
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Help: ${title}`}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>

      {isOpen && (
        <div ref={popoverRef} className={styles.popover} role="dialog" aria-label={title}>
          <div className={styles.header}>
            <h4 className={styles.title}>{title}</h4>
            <button
              className={styles.close}
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className={styles.list}>
            {bullets.map((bullet, idx) => (
              <li key={idx} className={styles.item}>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default HelpPopover;
