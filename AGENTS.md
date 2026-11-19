# AGENTS.md

## Project
<!-- TODO: describe the product, stack, and how to build/test/run -->
- Install: `TODO`
- Test: `TODO`
- Lint: `TODO`

## Conventions
- Spec-driven: no feature code without a merged spec in `docs/specs/`.
- Specs use EARS requirement syntax; each requirement has an ID (e.g. `REQ-001`).
- Agents execute; humans decide. Two human gates: spec PR approval and final PR merge.
- Quality gate order (always): testing, accessibility, performance, code-review, security.

## Agents
See `docs/WORKFLOW.md` and `.github/agents/`.

## Boundaries
- Never commit secrets. Never disable CI checks. Never merge.
