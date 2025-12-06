import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getWeekKey } from '../core/date';
import { parseAppDataJson, serializeAppData } from '../core/importExport';
import { appDataSchema, CURRENT_SCHEMA_VERSION } from './schema';
import {
  AppData,
  DailyEntry,
  Preferences,
  Pledge,
  Task,
  TaskRef,
  TimerState,
  WeeklyPlan,
} from './types';

type SessionDurations = {
  workMinutes?: number;
  breakMinutes?: number;
};

type AppActions = {
  setName: (name: string) => void;
  setPledgeDraft: (pledgeDraft?: string) => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
  completeOnboarding: (options?: { pledgeText?: string }) => void;
  ensureDailyEntry: (date: string) => DailyEntry;
  ensureWeeklyPlan: (weekStart: string | Date) => WeeklyPlan;
  setTaskText: (date: string, taskIndex: number, text: string) => void;
  setTaskTarget: (date: string, taskIndex: number, targetPomodoros: number | null) => void;
  setTaskDone: (date: string, taskIndex: number, done: boolean) => void;
  incrementTaskPomodoro: (date: string, taskIndex: number) => void;
  decrementTaskPomodoro: (date: string, taskIndex: number) => void;
  setTaskPomodorosActual: (date: string, taskIndex: number, actual: number) => void;
  setNotes: (date: string, text: string) => void;
  setProductivityScore: (date: string, score: number | null) => void;
  setProductivityReflection: (date: string, text: string) => void;
  setWeeklyMostImportant: (weekStart: string | Date, index: number, text: string) => void;
  setWeeklySecondary: (weekStart: string | Date, index: number, text: string) => void;
  setWeeklyAdditional: (weekStart: string | Date, index: number, text: string) => void;
  setWeeklyCommitment: (weekStart: string | Date, text: string) => void;
  setPledge: (data: {
    text?: string;
    signatureName: string;
    startDate: string;
    importantBecauseLines: string[];
    reward: string;
    consequence: string;
    ensureActions?: string[];
  }) => void;
  togglePledgeDay: (index: number) => void;
  resetPledge: () => void;
  restartPledge: () => void;
  canInteractWithTask: (date: string, taskIndex: number) => {
    canStartTimer: boolean;
    canMarkDone: boolean;
    blockingReason?: string;
  };
  openTimer: () => void;
  closeTimer: () => void;
  startWork: (taskRef?: TaskRef, session?: SessionDurations) => void;
  startWorkOnTask: (date: string, taskIndex: number, session?: SessionDurations) => void;
  startGenericWork: (session?: SessionDurations) => void;
  startBreak: (session?: Pick<SessionDurations, 'breakMinutes'>) => void;
  pause: () => void;
  resume: () => void;
  resetTimer: () => void;
  tick: () => void;
  exportState: () => string;
  importState: (json: string) => void;
  deleteAllData: () => void;
};

export type AppStore = AppData & AppActions;

const STORAGE_KEY = 'productivity-planner-state';

const toDateFromInput = (input: string | Date): Date =>
  input instanceof Date ? input : new Date(`${input}T00:00:00`);

const BASE_PREFERENCES: Preferences = {
  theme: 'laduree',
  weekStartsOn: 'monday',
  pomodoroMinutes: 25,
  breakMinutes: 5,
  enforceTaskOrder: true,
  soundEnabled: true,
};

const createDefaultPreferences = (): Preferences => ({ ...BASE_PREFERENCES });

const createTimerState = (preferences: Preferences): TimerState => ({
  status: 'idle',
  phase: 'work',
  secondsLeft: preferences.pomodoroMinutes * 60,
  endsAt: null,
  workDurationSeconds: preferences.pomodoroMinutes * 60,
  breakDurationSeconds: preferences.breakMinutes * 60,
  activeTaskRef: undefined,
  uiOpen: false,
  lastError: undefined,
});

const computeEndsAt = (durationSeconds: number): number => Date.now() + durationSeconds * 1000;

const computeSecondsLeft = (timer: TimerState): number => {
  if (timer.status !== 'running' || !timer.endsAt) {
    return Math.max(0, Math.round(timer.secondsLeft ?? 0));
  }
  const diffMs = timer.endsAt - Date.now();
  return Math.max(0, Math.ceil(diffMs / 1000));
};

const createEmptyTask = (): Task => ({
  text: '',
  targetPomodoros: 1,
  actualPomodoros: 0,
  done: false,
});

const createDailyEntry = (date: string): DailyEntry => ({
  date,
  tasks: Array.from({ length: 5 }, () => createEmptyTask()),
  notes: '',
  productivityScore: 5,
  productivityReflection: '',
});

const ensureDailyEntry = (state: AppStore, date: string): DailyEntry =>
  state.daily[date] ? normalizeDailyEntry(state.daily[date], date) : createDailyEntry(date);

const isTaskIndexValid = (index: number) => index >= 0 && index <= 4;

const normalizeTasks = (tasks: Task[] = []): Task[] => {
  const normalized = tasks.slice(0, 5).map<Task>((task) => ({
    text: task.text ?? '',
    targetPomodoros:
      typeof task.targetPomodoros === 'number' && task.targetPomodoros > 0
        ? Math.max(1, Math.round(task.targetPomodoros))
        : 1,
    actualPomodoros: Math.max(0, task.actualPomodoros ?? 0),
    done: !!task.done,
  }));

  while (normalized.length < 5) {
    normalized.push(createEmptyTask());
  }

  return normalized;
};

const buildStartWorkUpdate = (state: AppStore, taskRef?: TaskRef, session?: SessionDurations): Partial<AppStore> => {
  const preferences = state.preferences;
  const activeTaskRef = taskRef ?? undefined;
  let dailyUpdates: Record<string, DailyEntry> | undefined;

  if (activeTaskRef && !isTaskIndexValid(activeTaskRef.taskIndex)) {
    return {
      timer: { ...state.timer, lastError: 'Invalid task index' },
    };
  }

  if (activeTaskRef) {
    const entry = ensureDailyEntry(state, activeTaskRef.date);
    const interaction = buildTaskInteraction(entry.tasks, activeTaskRef.taskIndex, preferences.enforceTaskOrder);
    if (!interaction.canStartTimer) {
      return { timer: { ...state.timer, lastError: interaction.blockingReason } };
    }
    const tasks = normalizeTasks(entry.tasks);
    dailyUpdates = { ...state.daily, [activeTaskRef.date]: { ...entry, tasks } };
  }

  const baseWorkSeconds = preferences.pomodoroMinutes * 60;
  const baseBreakSeconds = preferences.breakMinutes * 60;

  const workDurationSeconds =
    typeof session?.workMinutes === 'number'
      ? Math.max(5 * 60, Math.min(60 * 60, Math.round(session.workMinutes) * 60))
      : baseWorkSeconds;

  const breakDurationSeconds =
    typeof session?.breakMinutes === 'number'
      ? Math.max(1 * 60, Math.min(30 * 60, Math.round(session.breakMinutes) * 60))
      : baseBreakSeconds;

  const durationSeconds = workDurationSeconds;
  const timer: TimerState = {
    ...state.timer,
    status: 'running',
    phase: 'work',
    secondsLeft: durationSeconds,
    endsAt: computeEndsAt(durationSeconds),
    workDurationSeconds,
    breakDurationSeconds,
    activeTaskRef,
    uiOpen: true,
    lastError: undefined,
  };

  return {
    ...(dailyUpdates ? { daily: dailyUpdates } : {}),
    timer,
  };
};

const normalizeDailyEntry = (entry: DailyEntry, dateOverride?: string): DailyEntry => ({
  date: dateOverride ?? entry.date,
  tasks: normalizeTasks(entry.tasks),
  notes: entry.notes ?? '',
  productivityScore:
    typeof entry.productivityScore === 'number'
      ? Math.min(10, Math.max(1, entry.productivityScore))
      : 5,
  productivityReflection: entry.productivityReflection ?? '',
});

const normalizeChecklist = (checklist?: boolean[]): boolean[] => {
  const normalized = (checklist ?? []).slice(0, 5).map(Boolean);
  while (normalized.length < 5) {
    normalized.push(false);
  }
  return normalized;
};

const normalizeWeeklyPlan = (weekStart: string, plan?: WeeklyPlan): WeeklyPlan => {
  const normalizeList = (list: string[], length: number): string[] => {
    const normalized = [...list].slice(0, length);
    while (normalized.length < length) {
      normalized.push('');
    }
    return normalized;
  };

  return {
    weekStart,
    mostImportant: normalizeList(plan?.mostImportant ?? [], 5),
    secondary: normalizeList(plan?.secondary ?? [], 6),
    additional: normalizeList(plan?.additional ?? [], 5),
    commitment: plan?.commitment ?? '',
  };
};

const normalizeTimerState = (timer: TimerState | undefined, preferences: Preferences): TimerState => {
  const base = createTimerState(preferences);
  if (!timer) return base;

  const phase: TimerState['phase'] = timer.phase === 'break' ? 'break' : 'work';
  const status: TimerState['status'] =
    timer.status === 'running' || timer.status === 'paused' ? timer.status : 'idle';
  const workDurationSeconds =
    typeof timer.workDurationSeconds === 'number' && timer.workDurationSeconds > 0
      ? timer.workDurationSeconds
      : preferences.pomodoroMinutes * 60;
  const breakDurationSeconds =
    typeof timer.breakDurationSeconds === 'number' && timer.breakDurationSeconds > 0
      ? timer.breakDurationSeconds
      : preferences.breakMinutes * 60;

  const defaultSeconds = phase === 'work' ? workDurationSeconds : breakDurationSeconds;
  let secondsLeft =
    typeof timer.secondsLeft === 'number' && timer.secondsLeft >= 0 ? timer.secondsLeft : defaultSeconds;
  let endsAt = timer.endsAt ?? null;

  if (status === 'running') {
    if (!endsAt) {
      endsAt = computeEndsAt(secondsLeft || defaultSeconds);
    }
    secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  } else {
    endsAt = null;
  }

  const activeTaskRef =
    timer.activeTaskRef && timer.activeTaskRef.taskIndex >= 0 && timer.activeTaskRef.taskIndex <= 4
      ? { ...timer.activeTaskRef }
      : undefined;

  return {
    status,
    phase,
    secondsLeft,
    endsAt,
    workDurationSeconds,
    breakDurationSeconds,
    activeTaskRef,
    uiOpen: !!timer.uiOpen,
    lastError: timer.lastError,
  };
};

const normalizeAppData = (data: AppData): AppData => {
  const preferences = { ...createDefaultPreferences(), ...data.preferences };
  const onboarding = {
    name: data.onboarding?.name ?? '',
    onboardingCompleted: !!data.onboarding?.onboardingCompleted,
    pledgeDraft: data.onboarding?.pledgeDraft,
  };
  const daily: Record<string, DailyEntry> = {};
  Object.entries(data.daily ?? {}).forEach(([date, entry]) => {
    daily[date] = normalizeDailyEntry(entry, date);
  });

  const weekly: Record<string, WeeklyPlan> = {};
  Object.entries(data.weekly ?? {}).forEach(([weekStart, plan]) => {
    weekly[weekStart] = normalizeWeeklyPlan(weekStart, plan);
  });

  const pledge = data.pledge
    ? {
        text: data.pledge.text ?? '',
        signatureName: data.pledge.signatureName ?? '',
        startDate: data.pledge.startDate ?? '',
        importantBecauseLines: (() => {
          const lines = data.pledge?.importantBecauseLines ?? [];
          while (lines.length < 3) lines.push('');
          return lines.slice(0, 3);
        })(),
        reward: data.pledge.reward ?? '',
        consequence: data.pledge.consequence ?? '',
        ensureActions: (() => {
          const items = data.pledge?.ensureActions ?? [];
          return items.slice(0, 5);
        })(),
        checklist: normalizeChecklist(data.pledge.checklist),
        createdAt: data.pledge.createdAt,
        lastUpdatedAt: data.pledge.lastUpdatedAt,
      }
    : undefined;

  const timer = normalizeTimerState(data.timer, preferences);

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    preferences,
    onboarding,
    daily,
    weekly,
    pledge,
    timer,
    lastImportedAt: data.lastImportedAt,
  };
};

const createInitialData = (): AppData => {
  const preferences = createDefaultPreferences();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    preferences,
    onboarding: { name: '', onboardingCompleted: false },
    daily: {},
    weekly: {},
    pledge: undefined,
    timer: createTimerState(preferences),
    lastImportedAt: undefined,
  };
};

const pickData = (state: AppStore): AppData => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  preferences: state.preferences,
  onboarding: state.onboarding,
  daily: state.daily,
  weekly: state.weekly,
  pledge: state.pledge,
  timer: state.timer,
  lastImportedAt: state.lastImportedAt,
});

const isTaskOrderBlocked = (tasks: Task[], taskIndex: number, enforce: boolean): boolean =>
  enforce && taskIndex > 0 && tasks.slice(0, taskIndex).some((task) => !task.done);

const buildTaskInteraction = (
  tasks: Task[],
  taskIndex: number,
  enforce: boolean,
): { canStartTimer: boolean; canMarkDone: boolean; blockingReason?: string } => {
  if (!isTaskIndexValid(taskIndex)) {
    return { canStartTimer: false, canMarkDone: false, blockingReason: 'Invalid task index' };
  }
  const blocked = isTaskOrderBlocked(tasks, taskIndex, enforce);
  return {
    canStartTimer: !blocked,
    canMarkDone: !blocked,
    blockingReason: blocked ? 'Complete earlier tasks first' : undefined,
  };
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createInitialData(),
      setName: (name) =>
        set((state) => ({
          onboarding: { ...state.onboarding, name },
        })),
      setPledgeDraft: (pledgeDraft) =>
        set((state) => ({
          onboarding: { ...state.onboarding, pledgeDraft },
        })),
      updatePreferences: (prefs) =>
        set((state) => {
          const preferences = { ...state.preferences, ...prefs };
          const updates: Partial<AppStore> = { preferences };
          if (state.timer.status === 'idle') {
            const workSeconds = preferences.pomodoroMinutes * 60;
            const breakSeconds = preferences.breakMinutes * 60;
            const baseSeconds = state.timer.phase === 'work' ? workSeconds : breakSeconds;
            updates.timer = {
              ...state.timer,
              secondsLeft: baseSeconds,
              endsAt: null,
              workDurationSeconds: workSeconds,
              breakDurationSeconds: breakSeconds,
            };
          }
          return updates;
        }),
      completeOnboarding: (options) =>
        set((state) => {
          const onboarding = { ...state.onboarding, onboardingCompleted: true, pledgeDraft: undefined };
          const pledgeText = options?.pledgeText ?? state.onboarding.pledgeDraft;
          const updates: Partial<AppStore> = { onboarding };
          if (pledgeText && pledgeText.trim().length > 0) {
            updates.pledge = {
              text: pledgeText.trim(),
              signatureName: state.onboarding.name || '',
              startDate: new Date().toISOString(),
              importantBecauseLines: ['', '', ''],
              reward: '',
              consequence: '',
              ensureActions: [],
              checklist: Array(5).fill(false),
              createdAt: new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
            };
          }
          return updates;
        }),
      ensureDailyEntry: (date) => {
        const state = get();
        const existing = state.daily[date];
        if (existing) {
          const normalized = normalizeDailyEntry(existing, date);
          if (state.daily[date] !== normalized) {
            set((s) => ({ daily: { ...s.daily, [date]: normalized } }));
          }
          return normalized;
        }
        const created = createDailyEntry(date);
        set((s) => ({ daily: { ...s.daily, [date]: created } }));
        return created;
      },
      ensureWeeklyPlan: (weekStart) => {
        const state = get();
        const weekKey = getWeekKey(toDateFromInput(weekStart), state.preferences.weekStartsOn);
        const existing = state.weekly[weekKey];
        const normalized = normalizeWeeklyPlan(weekKey, existing);
        if (!existing) {
          set((s) => ({ weekly: { ...s.weekly, [weekKey]: normalized } }));
        } else {
          set((s) => ({ weekly: { ...s.weekly, [weekKey]: normalized } }));
        }
        return normalized;
      },
      setTaskText: (date, taskIndex, text) =>
        set((state) => {
          if (!isTaskIndexValid(taskIndex)) return {};
          const entry = ensureDailyEntry(state, date);
          const tasks = entry.tasks.map((task, idx) => (idx === taskIndex ? { ...task, text } : task));
          return { daily: { ...state.daily, [date]: { ...entry, tasks } } };
        }),
      setTaskTarget: (date, taskIndex, targetPomodoros) =>
        set((state) => {
          if (!isTaskIndexValid(taskIndex)) return {};
          const entry = ensureDailyEntry(state, date);
          const sanitizedTarget =
            targetPomodoros === null || targetPomodoros === undefined
              ? 1
              : Math.max(1, Math.round(targetPomodoros));
          const tasks = entry.tasks.map((task, idx) =>
            idx === taskIndex ? { ...task, targetPomodoros: sanitizedTarget } : task,
          );
          return { daily: { ...state.daily, [date]: { ...entry, tasks } } };
        }),
      setTaskDone: (date, taskIndex, done) =>
        set((state) => {
          if (!isTaskIndexValid(taskIndex)) return {};
          const entry = ensureDailyEntry(state, date);
          if (isTaskOrderBlocked(entry.tasks, taskIndex, state.preferences.enforceTaskOrder) && done) {
            return {};
          }
          const tasks = entry.tasks.map((task, idx) => (idx === taskIndex ? { ...task, done } : task));
          return { daily: { ...state.daily, [date]: { ...entry, tasks } } };
        }),
      incrementTaskPomodoro: (date, taskIndex) =>
        set((state) => {
          if (!isTaskIndexValid(taskIndex)) return {};
          const entry = ensureDailyEntry(state, date);
          const tasks = entry.tasks.map((task, idx) =>
            idx === taskIndex
              ? { ...task, actualPomodoros: Math.max(0, task.actualPomodoros) + 1 }
              : task,
          );
          return { daily: { ...state.daily, [date]: { ...entry, tasks } } };
        }),
      decrementTaskPomodoro: (date, taskIndex) =>
        set((state) => {
          if (!isTaskIndexValid(taskIndex)) return {};
          const entry = ensureDailyEntry(state, date);
          const tasks = entry.tasks.map((task, idx) =>
            idx === taskIndex
              ? { ...task, actualPomodoros: Math.max(0, task.actualPomodoros - 1) }
              : task,
          );
          return { daily: { ...state.daily, [date]: { ...entry, tasks } } };
        }),
      setTaskPomodorosActual: (date, taskIndex, actual) =>
        set((state) => {
          if (!isTaskIndexValid(taskIndex)) return {};
          const entry = ensureDailyEntry(state, date);
          const sanitized = Math.max(0, Math.round(actual));
          const tasks = entry.tasks.map((task, idx) =>
            idx === taskIndex ? { ...task, actualPomodoros: sanitized } : task,
          );
          return { daily: { ...state.daily, [date]: { ...entry, tasks } } };
        }),
      setNotes: (date, text) =>
        set((state) => {
          const entry = ensureDailyEntry(state, date);
          return { daily: { ...state.daily, [date]: { ...entry, notes: text } } };
        }),
      setProductivityScore: (date, score) =>
        set((state) => {
          const entry = ensureDailyEntry(state, date);
          const normalizedScore =
            score === null ? null : Math.min(10, Math.max(1, Math.round(score)));
          return {
            daily: { ...state.daily, [date]: { ...entry, productivityScore: normalizedScore } },
          };
        }),
      setProductivityReflection: (date, text) =>
        set((state) => {
          const entry = ensureDailyEntry(state, date);
          return {
            daily: { ...state.daily, [date]: { ...entry, productivityReflection: text } },
          };
        }),
      setWeeklyMostImportant: (weekStart, index, text) =>
        set((state) => {
          if (index < 0 || index > 4) return {};
          const weekKey = getWeekKey(toDateFromInput(weekStart), state.preferences.weekStartsOn);
          const weeklyPlan = normalizeWeeklyPlan(weekKey, state.weekly[weekKey]);
          const mostImportant = [...weeklyPlan.mostImportant];
          mostImportant[index] = text;
          return { weekly: { ...state.weekly, [weekKey]: { ...weeklyPlan, mostImportant } } };
        }),
      setWeeklySecondary: (weekStart, index, text) =>
        set((state) => {
          if (index < 0 || index > 5) return {};
          const weekKey = getWeekKey(toDateFromInput(weekStart), state.preferences.weekStartsOn);
          const weeklyPlan = normalizeWeeklyPlan(weekKey, state.weekly[weekKey]);
          const secondary = [...weeklyPlan.secondary];
          secondary[index] = text;
          return { weekly: { ...state.weekly, [weekKey]: { ...weeklyPlan, secondary } } };
        }),
      setWeeklyAdditional: (weekStart, index, text) =>
        set((state) => {
          if (index < 0 || index > 4) return {};
          const weekKey = getWeekKey(toDateFromInput(weekStart), state.preferences.weekStartsOn);
          const weeklyPlan = normalizeWeeklyPlan(weekKey, state.weekly[weekKey]);
          const additional = [...weeklyPlan.additional];
          additional[index] = text;
          return { weekly: { ...state.weekly, [weekKey]: { ...weeklyPlan, additional } } };
        }),
      setWeeklyCommitment: (weekStart, text) =>
        set((state) => {
          const weekKey = getWeekKey(toDateFromInput(weekStart), state.preferences.weekStartsOn);
          const weeklyPlan = normalizeWeeklyPlan(weekKey, state.weekly[weekKey]);
          return { weekly: { ...state.weekly, [weekKey]: { ...weeklyPlan, commitment: text } } };
        }),
      setPledge: (data) =>
        set((state) => {
          const checklist = state.pledge ? [...state.pledge.checklist] : Array(5).fill(false);
          const ensureActions = (data.ensureActions ?? []).slice(0, 5);
          const importantBecauseLines = [...data.importantBecauseLines].slice(0, 3);
          while (importantBecauseLines.length < 3) importantBecauseLines.push('');
          return {
            pledge: {
              text: data.text?.trim() ?? (state.pledge?.text ?? ''),
              signatureName: data.signatureName.trim(),
              startDate: data.startDate,
              importantBecauseLines,
              reward: data.reward.trim(),
              consequence: data.consequence.trim(),
              ensureActions,
              checklist,
              createdAt: state.pledge?.createdAt ?? new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
            },
          };
        }),
      togglePledgeDay: (index) =>
        set((state) => {
          if (index < 0 || index > 4) return {};
          if (!state.pledge) return {};
          if (isPledgeComplete(state.pledge)) return {};
          const checklist = [...state.pledge.checklist];
          const nextValue = !checklist[index];

          // Enforce sequence for checking: you can only check day N if all previous days are checked.
          if (nextValue) {
            const blocked = checklist.slice(0, index).some((done) => !done);
            if (blocked) {
              return {};
            }
          } else {
            // Unchecking: only allow unchecking the highest completed day to maintain reverse order.
            const highestChecked = checklist.lastIndexOf(true);
            if (index !== highestChecked) {
              return {};
            }
          }

          checklist[index] = nextValue;
          return {
            pledge: {
              ...state.pledge,
              checklist,
              lastUpdatedAt: new Date().toISOString(),
            },
          };
        }),
      resetPledge: () =>
        set(() => ({
          pledge: undefined,
        })),
      restartPledge: () =>
        set((state) => {
          if (!state.pledge) return {};
          return {
            pledge: {
              ...state.pledge,
              checklist: Array(5).fill(false),
              lastUpdatedAt: new Date().toISOString(),
            },
          };
        }),
      canInteractWithTask: (date, taskIndex) => {
        const state = get();
        const entry = ensureDailyEntry(state, date);
        return buildTaskInteraction(entry.tasks, taskIndex, state.preferences.enforceTaskOrder);
      },
      openTimer: () =>
        set((state) => ({
          timer: { ...state.timer, uiOpen: true },
        })),
      closeTimer: () =>
        set((state) => ({
          timer: { ...state.timer, uiOpen: false },
        })),
      startWork: (taskRef, session) => set((state) => buildStartWorkUpdate(state, taskRef, session)),
      startWorkOnTask: (date, taskIndex, session) =>
        set((state) => buildStartWorkUpdate(state, { date, taskIndex }, session)),
      startGenericWork: (session) => set((state) => buildStartWorkUpdate(state, undefined, session)),
      startBreak: (session) =>
        set((state) => {
          const baseWorkSeconds = state.preferences.pomodoroMinutes * 60;
          const baseBreakSeconds = state.preferences.breakMinutes * 60;

          const workDurationSeconds =
            typeof state.timer.workDurationSeconds === 'number' && state.timer.workDurationSeconds > 0
              ? state.timer.workDurationSeconds
              : baseWorkSeconds;

          const breakDurationSecondsFromState =
            typeof state.timer.breakDurationSeconds === 'number' && state.timer.breakDurationSeconds > 0
              ? state.timer.breakDurationSeconds
              : baseBreakSeconds;

          const breakDurationSeconds =
            typeof session?.breakMinutes === 'number'
              ? Math.max(1 * 60, Math.min(30 * 60, Math.round(session.breakMinutes) * 60))
              : breakDurationSecondsFromState;

          return {
            timer: {
              ...state.timer,
              phase: 'break',
              status: 'running',
              secondsLeft: breakDurationSeconds,
              endsAt: computeEndsAt(breakDurationSeconds),
              workDurationSeconds,
              breakDurationSeconds,
              activeTaskRef: state.timer.activeTaskRef,
              lastError: undefined,
            },
          };
        }),
      pause: () =>
        set((state) => {
          if (state.timer.status !== 'running') return {};
          const secondsLeft = computeSecondsLeft(state.timer);
          return { timer: { ...state.timer, status: 'paused', secondsLeft, endsAt: null } };
        }),
      resume: () =>
        set((state) => {
          if (state.timer.status !== 'paused') return {};
          const secondsLeft = Math.max(0, Math.round(state.timer.secondsLeft));
          if (secondsLeft <= 0) {
            const workSeconds = state.preferences.pomodoroMinutes * 60;
            const breakSeconds = state.preferences.breakMinutes * 60;
            return {
              timer: {
                ...state.timer,
                status: 'idle',
                phase: 'work',
                secondsLeft: workSeconds,
                endsAt: null,
                activeTaskRef: undefined,
                lastError: undefined,
                workDurationSeconds: workSeconds,
                breakDurationSeconds: breakSeconds,
              },
            };
          }
          return {
            timer: {
              ...state.timer,
              status: 'running',
              secondsLeft,
              endsAt: computeEndsAt(secondsLeft),
              lastError: undefined,
            },
          };
        }),
      resetTimer: () =>
        set((state) => {
          const workSeconds = state.preferences.pomodoroMinutes * 60;
          const breakSeconds = state.preferences.breakMinutes * 60;
          return {
            timer: {
              ...state.timer,
              status: 'idle',
              phase: 'work',
              secondsLeft: workSeconds,
              endsAt: null,
              activeTaskRef: undefined,
              lastError: undefined,
              workDurationSeconds: workSeconds,
              breakDurationSeconds: breakSeconds,
            },
          };
        }),
      tick: () =>
        set((state) => {
          if (state.timer.status !== 'running') return {};
          const secondsRemaining = computeSecondsLeft(state.timer);
          if (secondsRemaining > 0) {
            return { timer: { ...state.timer, secondsLeft: secondsRemaining } };
          }

          if (state.timer.phase === 'work') {
            let dailyUpdates: Record<string, DailyEntry> | undefined;
            const ref = state.timer.activeTaskRef;
            if (ref && ref.taskIndex >= 0 && ref.taskIndex <= 4) {
              const entry = state.daily[ref.date]
                ? normalizeDailyEntry(state.daily[ref.date], ref.date)
                : createDailyEntry(ref.date);
              const tasks = normalizeTasks(entry.tasks);
              const task = tasks[ref.taskIndex];
              tasks[ref.taskIndex] = { ...task, actualPomodoros: Math.max(0, task.actualPomodoros) + 1 };
              dailyUpdates = { ...state.daily, [ref.date]: { ...entry, tasks } };
            }

            const workDurationSeconds =
              typeof state.timer.workDurationSeconds === 'number' && state.timer.workDurationSeconds > 0
                ? state.timer.workDurationSeconds
                : state.preferences.pomodoroMinutes * 60;
            const breakDurationSeconds =
              typeof state.timer.breakDurationSeconds === 'number' && state.timer.breakDurationSeconds > 0
                ? state.timer.breakDurationSeconds
                : state.preferences.breakMinutes * 60;

            const timer: TimerState = {
              ...state.timer,
              phase: 'break',
              status: 'running',
              secondsLeft: breakDurationSeconds,
              endsAt: computeEndsAt(breakDurationSeconds),
              workDurationSeconds,
              breakDurationSeconds,
              lastError: undefined,
            };

            return {
              ...(dailyUpdates ? { daily: dailyUpdates } : {}),
              timer,
            };
          }

          const workDurationSeconds =
            typeof state.timer.workDurationSeconds === 'number' && state.timer.workDurationSeconds > 0
              ? state.timer.workDurationSeconds
              : state.preferences.pomodoroMinutes * 60;
          const breakDurationSeconds =
            typeof state.timer.breakDurationSeconds === 'number' && state.timer.breakDurationSeconds > 0
              ? state.timer.breakDurationSeconds
              : state.preferences.breakMinutes * 60;

          const timer: TimerState = {
            ...state.timer,
            phase: 'work',
            status: 'idle',
            secondsLeft: workDurationSeconds,
            endsAt: null,
            workDurationSeconds,
            breakDurationSeconds,
            lastError: undefined,
          };

          return { timer };
        }),
      exportState: () => {
        const data = pickData(get());
        return serializeAppData(data);
      },
      importState: (json) => {
        const parsed = parseAppDataJson(json);
        const normalized = normalizeAppData(parsed);
        normalized.lastImportedAt = new Date().toISOString();
        set(() => normalized);
      },
      deleteAllData: () => set(() => createInitialData()),
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_SCHEMA_VERSION,
      storage: createJSONStorage<AppData>(() => localStorage),
      partialize: (state) => pickData(state as AppStore),
      migrate: (persistedState) => {
        const result = appDataSchema.safeParse(persistedState);
        if (!result.success) {
          return createInitialData();
        }
        return normalizeAppData(result.data);
      },
    },
  ),
);

export const getWeekKeyForDate = (date: Date, weekStartsOn: Preferences['weekStartsOn']): string =>
  getWeekKey(date, weekStartsOn);

export const isPledgeComplete = (pledge?: Pledge): boolean =>
  pledge ? pledge.checklist.every(Boolean) : false;
