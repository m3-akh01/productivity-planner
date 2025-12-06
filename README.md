# Productivity Planner (Static, Local-First)

Local-only productivity planner built with Vite + React + TypeScript. All data lives in `localStorage`; there is no backend, PWA, or network usage.

Key features:
- Daily page with 5 most important tasks, notes, and a 1–10 productivity reflection slider.
- Weekly planning page keyed by start-of-week.
- 5-day pledge with a checklist and gentle enforcement.
- Floating Pomodoro timer bubble with session-only duration controls and optional end-of-session chime.
- Themeable UI with a dark “Nocturne” look and a light “Ladurée” paper notebook theme.

## Development
- Install: `npm install`
- Run dev server: `npm run dev`
- Type-check only: `npm run lint`
- Build: `npm run build`

## Deployment (GitHub Pages via Actions)
- The router uses `HashRouter` for deep links on Pages.
- `vite.config.ts` sets `base: "./"` so the built `dist/` works under any subpath.
- This repo is wired to deploy with GitHub Actions using `.github/workflows/deploy-pages.yml` on pushes to `main`.

### How deployment works
1) On every push to `main`, the `Deploy to GitHub Pages` workflow:
   - checks out the repo
   - runs `npm ci` and `npm run build`
   - uploads `dist/` as the Pages artifact
   - deploys it via `actions/deploy-pages` to the `github-pages` environment.
2) In the repo’s GitHub Pages settings, the source is set to “GitHub Actions”.

### Manual deployment options
If you ever want to deploy without CI:
1) Build locally: `npm run build` (outputs to `dist/`).
2) Option A: push the `dist/` contents to a `gh-pages` branch and enable Pages from that branch.
3) Option B: serve `dist/` from any static hosting provider that supports SPAs.

## Architecture Notes
- State: Zustand store (`src/store/appStore.ts`) with `localStorage` persistence, schema versioning, import/export, and danger-zone delete hook.
- Data models: onboarding (name + preferences, including theme), daily tasks (5 slots per day), weekly plans keyed by start-of-week (date-fns), pledge with 5-day checklist, and a global Pomodoro/break timer.
- Pomodoro engine: timer state tracks `workDurationSeconds` / `breakDurationSeconds`, with a `usePomodoroEngine` hook that handles ticking and plays a chime when a session completes.
- Import/export: JSON validated with zod (`src/core/importExport.ts`, `src/store/schema.ts`).
- Content: greetings, help text, and 100+ prompts/quotes in `src/core/`.
- Routing: React Router `HashRouter` with pages for Onboarding, Daily, Weekly, Pledge, and Settings.
