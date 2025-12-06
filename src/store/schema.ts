import { z } from 'zod';

export const CURRENT_SCHEMA_VERSION = 1;

const rawThemeSchema = z.union([
  z.literal('nocturne'),
  z.literal('laduree'),
  // Backwards-compat alias for previously stored values
  z.literal('midnight-editorial'),
]);

export const preferencesSchema = z.object({
  theme: rawThemeSchema
    .default('laduree')
    .transform((value) => (value === 'midnight-editorial' ? 'nocturne' : value)),
  weekStartsOn: z.union([z.literal('sunday'), z.literal('monday')]),
  pomodoroMinutes: z.number().positive(),
  breakMinutes: z.number().positive(),
  enforceTaskOrder: z.boolean(),
  soundEnabled: z.boolean(),
});

export const taskSchema = z.object({
  text: z.string(),
  targetPomodoros: z.number().int().positive().nullable().optional(),
  actualPomodoros: z.number().int().nonnegative(),
  done: z.boolean(),
});

export const dailyEntrySchema = z.object({
  date: z.string(),
  tasks: z.array(taskSchema).length(5),
  notes: z.string().optional(),
  productivityScore: z.number().min(1).max(10).nullable().optional(),
  productivityReflection: z.string().optional(),
});

export const weeklyPlanSchema = z.object({
  weekStart: z.string(),
  mostImportant: z.array(z.string()).length(5).default(Array(5).fill('')),
  secondary: z.array(z.string()).length(6).default(Array(6).fill('')),
  additional: z.array(z.string()).length(5).default(Array(5).fill('')),
  commitment: z.string().default(''),
});

export const pledgeSchema = z.object({
  text: z.string().default(''),
  signatureName: z.string().default(''),
  startDate: z.string().default(''),
  importantBecauseLines: z.array(z.string()).length(3).default(['', '', '']),
  reward: z.string().default(''),
  consequence: z.string().default(''),
  ensureActions: z.array(z.string()).max(5).default([]),
  checklist: z.array(z.boolean()).length(5).default(Array(5).fill(false)),
  createdAt: z.string(),
  lastUpdatedAt: z.string().optional(),
});

export const timerStateSchema = z.object({
  status: z.union([z.literal('idle'), z.literal('running'), z.literal('paused')]),
  phase: z.union([z.literal('work'), z.literal('break')]),
  secondsLeft: z.number().nonnegative(),
  endsAt: z.number().int().nonnegative().optional().nullable(),
  workDurationSeconds: z.number().positive().optional(),
  breakDurationSeconds: z.number().positive().optional(),
  activeTaskRef: z
    .object({
      date: z.string(),
      taskIndex: z.number().int().min(0).max(4),
    })
    .optional(),
  uiOpen: z.boolean(),
  lastError: z.string().optional(),
});

export const onboardingSchema = z.object({
  name: z.string(),
  onboardingCompleted: z.boolean(),
  pledgeDraft: z.string().optional(),
});

export const appDataSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  preferences: preferencesSchema,
  onboarding: onboardingSchema,
  daily: z.record(dailyEntrySchema),
  weekly: z.record(weeklyPlanSchema),
  pledge: pledgeSchema.optional(),
  timer: timerStateSchema,
  lastImportedAt: z.string().optional(),
});
