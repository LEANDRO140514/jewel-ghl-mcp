# Update Log

Use this file as the permanent repo update description. Every update should add one entry with the date, update number, and included changes.

| Date | Update # | Included |
| --- | ---: | --- |
| 2026-07-16 | 3 | **Fase 0: Contrato + Auth.** Contrato REST `{ ok, result, error }` en `/execute`, `/tools`, `/tools/call`. Middleware `requireSecret` (Bearer token) y `requireTenant` (headers x-ghl-access-token + x-ghl-location-id). Rutas protegidas: `/execute`, `/tools`, `/tools/call`, `/tool-inventory`, `/mcp`, `/sse`. Tests unitarios e integración. |
| 2026-06-11 | 2 | Simplicity and power layer: `first-run`, `connect`, `ready`, `demo`, and `explain-error` setup commands; safe config writing with backups; setup grades and next-command guidance; grouped live smoke summaries; high-level curated CRM agent tools for location overviews, daily briefings, broad search, pagination, next-best actions, contact follow-up, lead reactivation, missed-call response, pipeline cleanup, review requests, and invoice follow-up; plus tests and docs proving the no-credentials and confirmation-safe paths. |
| 2026-06-11 | 1 | Onboarding and agent setup overhaul: beginner-first README, `QUICKSTART.md`, `AGENT_SETUP.md`, setup/client/profile/safety/deployment docs, Node 20 requirement, `setup`, `doctor`, `agent-check`, client config aliases, Docker support, onboarding CI, MCP Apps setup status, safer live smoke checks, and live validation against a working GHL token/location. |