---
name: observability-standards
description: Logging, metrics, tracing and alerting conventions. Use when adding or reviewing instrumentation.
---

# Observability standards
- Structured JSON logs with correlation/trace IDs; never log PII or secrets.
- Emit RED metrics (rate, errors, duration) for each service endpoint.
- Propagate trace context across calls.
- Every new user-facing path has an alert or dashboard entry.
