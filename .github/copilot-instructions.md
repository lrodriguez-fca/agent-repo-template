# Copilot instructions

Read `AGENTS.md` first. Key rules:
- Work from the approved spec in `docs/specs/`; if requirements are ambiguous, ask before building.
- Humans approve and merge; never merge your own PR.
- Commit fixes in small, labelled commits (`feat:`, `fix(a11y):`, `fix(security):`, `perf:`, `test:`).
- Run tests and lint before pushing. Do not weaken tests or CI gates.
- Specialist agents live in `.github/agents/`; standards live in `.github/skills/`.
