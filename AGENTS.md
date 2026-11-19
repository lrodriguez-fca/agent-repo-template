# AGENTS.md

## Project
Pomodoro timer (spec: `docs/specs/2.md`). Client-only SPA: React + React Router (library/data mode, no SSR),
Vite, TypeScript, Vitest + Testing Library (unit/component, axe), Playwright + axe (browser a11y/layout).
- Install: `npm ci` (then `npx playwright install chromium` once for e2e)
- Test: `npm test` (unit/component); `npm run coverage`; `npm run test:e2e` (builds, serves, runs Playwright)
- Lint: `npm run lint` (ESLint + `tsc --noEmit`)
- Build / run: `npm run build`, `npm run dev`
- Tests reference requirement IDs (`REQ-###`) and acceptance test IDs (`AT-###`) in their names.

## Conventions
- Spec-driven: no feature code without a merged spec in `docs/specs/`.
- Specs use EARS requirement syntax; each requirement has an ID (e.g. `REQ-001`).
- Agents execute; humans decide. Two human gates: spec PR approval and final PR merge.
- Quality gate order (always): testing, accessibility, performance, code-review, security.

## Agents
See `docs/WORKFLOW.md` and `.github/agents/`.

## Boundaries
- Never commit secrets. Never disable CI checks. Never merge.
