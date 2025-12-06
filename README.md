# Productivity Planner (Static, Local-First)

Local-only productivity planner built with Vite + React + TypeScript. All data lives in `localStorage`; there is no backend, PWA, or network usage.

## Development
- Install: `npm install`
- Run dev server: `npm run dev`
- Type-check only: `npm run lint`
- Build: `npm run build`

## Deployment (GitHub Pages)
- The router uses `HashRouter` for deep links on Pages.
- `vite.config.ts` sets `base: "./"` so the built `dist/` works under any subpath.
- Serve the contents of `dist/` on GitHub Pages.

### How to deploy to GitHub Pages
1) Build locally: `npm run build` (outputs to `dist/`).
2) Option A (simple): push the `dist/` contents to a `gh-pages` branch and enable Pages from that branch.
3) Option B (CI): use GitHub Actions to run `npm ci && npm run build`, upload `dist/` as the Pages artifact, and deploy it via the Pages deploy action.

## Architecture Notes
- State: Zustand store (`src/store/appStore.ts`) with `localStorage` persistence, schema versioning, import/export, and danger-zone delete hook.
- Data models: onboarding (name + preferences), daily tasks (5 slots per day), weekly plans keyed by start-of-week (date-fns), pledge with 5-day checklist, and a global Pomodoro/break timer.
- Import/export: JSON validated with zod (`src/core/importExport.ts`, `src/store/schema.ts`).
- Content: greetings, help text, and 100+ prompts/quotes in `src/core/`.
- Routing: React Router `HashRouter` with placeholder pages for Onboarding, Daily, Weekly, Pledge, and Settings.
