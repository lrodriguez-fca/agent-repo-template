# Agent workflow

```
ticket -> requirements agent -> [HUMAN approves spec PR]
       -> implementer (Copilot cloud agent) builds, opens PR
       -> optional specialists (dependency-review, design-ui, documentation, coverage, repository-setup)
       -> quality gates, fixed order: testing > accessibility > performance > code-review > security
       -> observability -> deployment (optional)
       -> consolidation-helper summary -> [HUMAN reviews & merges]
(any agent -> ambiguity-escalation pauses for a human; ci-auto-fix runs on CI failure)
```

Principles: agents start on execution, humans decide; ask when ambiguous; security runs last;
agent definitions change only via reviewed PRs; swap tool connections (MCP), not agents.

## Triggering
Assign the issue to Copilot, or comment `@copilot use the orchestrator agent` on the PR.
See `.github/agents/orchestrator.agent.md`.

## Required secrets / variables
`JIRA_MCP_URL`, `CONFLUENCE_MCP_URL`, `NEWRELIC_MCP_URL`, `NEWRELIC_API_KEY`, `FIGMA_MCP_URL`
(configure under repo Settings > Environments > `copilot`).
