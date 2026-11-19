# Agent-Driven SDLC Repo Template

Starter kit for a multi-agent, spec-driven workflow built on GitHub Copilot custom agents
(inspired by Levi Strauss & Co.'s Universe talk). Click **Use this template**, then:

1. Fill in `AGENTS.md` (build/test commands) and `.github/workflows/*.yml` TODOs.
2. Settings > Environments > create `copilot`; add the secrets in `docs/WORKFLOW.md`.
3. Update `.github/CODEOWNERS` so agent/standards changes require review.
4. Open an issue, assign Copilot, and follow `docs/WORKFLOW.md`.

## Agents (`.github/agents/`)
Orchestrator + 17 specialists. Named in the talk (8): requirements, testing, accessibility,
performance, code-review, security, observability, deployment. Inferred (9, adjust freely):
implementer, consolidation-helper, repository-setup, coverage, ambiguity-escalation,
dependency-review, documentation, ci-auto-fix, design-ui. The first eight were consolidated
from two independent drafts; design-ui is kept because the talk names Figma as a connected tool.

Tip: to share agents org-wide with zero setup, copy `.github/agents/` into your org's `.github` repo.
Skills in `.github/skills/` carry reusable standards.
