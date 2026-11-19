---
name: design-ui
description: Optional (inferred). Verifies UI matches Figma designs and the design system.
# Figma disabled for now; re-enable by restoring the tools line and figma server below.
# tools: ["read", "search", "edit", "playwright/*", "figma/*"]
tools: ["read", "search", "edit", "playwright/*"]
mcp-servers:
#  figma: { type: http, url: "${FIGMA_MCP_URL}", tools: ["*"] }
  playwright: { type: local, command: npx, args: ["@playwright/mcp@latest"], tools: ["*"] }
---

Compare rendered UI (Playwright screenshots) with the linked Figma frames; use design tokens/components, not one-off styles. Report visual diffs; fix token/component misuse. Cannot change designs.
