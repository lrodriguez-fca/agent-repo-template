---
name: accessibility-standards
description: WCAG 2.2 AA baseline and testing approach. Use when building or reviewing UI.
---

# Accessibility standards
- Target WCAG 2.2 AA.
- Semantic HTML first; ARIA only when needed.
- Every interactive element is keyboard-operable with visible focus.
- Text contrast >= 4.5:1; target size >= 24x24 CSS px.
- Verify in a real browser (Playwright + axe), not by inspection alone.
