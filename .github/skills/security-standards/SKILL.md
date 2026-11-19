---
name: security-standards
description: Organization security baseline (OWASP, secrets, dependency policy). Use when reviewing or writing security-sensitive code.
---

# Security standards
- Validate and encode all external input; parameterize queries.
- No secrets in code or logs; use the secret store. Rotate anything exposed.
- Enforce authn/authz server-side on every route.
- Dependencies: no known Critical/High advisories; pin versions.
- Fix by severity: Critical > High > Medium > Low.
