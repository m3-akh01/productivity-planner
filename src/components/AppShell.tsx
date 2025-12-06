import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { getGreeting } from '../core/greetings';
import { TimerBubble } from './TimerBubble';
import styles from './AppShell.module.css';

const navItems = [
  { to: '/', label: 'Daily', end: true },
  { to: '/weekly', label: 'Weekly' },
  { to: '/pledge', label: 'Pledge' },
  { to: '/settings', label: 'Settings' },
];

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderText}>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </header>
  );
}

export function AppShell() {
  const name = useAppStore((state) => state.onboarding.name);

  const greeting = getGreeting(name || 'friend');

  return (
    <div className={styles.shell}>
      {/* Top Navigation Bar */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          {/* Brand / Logo */}
          <div className={styles.brand}>
            <span className={styles.brandIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </span>
            <span className={styles.brandText}>Planner</span>
          </div>

          {/* Navigation Links */}
          <div className={styles.navLinks}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Greeting */}
        </div>
      </nav>

      {/* Timer Bubble */}
      <TimerBubble />

      {/* Main Content Area */}
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppShell;
