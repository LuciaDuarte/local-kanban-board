# ADR 003: No backend, no auth

**Status:** Accepted  
**Date:** 2026-04-24

## Context

This is a personal kanban board tool. The question was whether to add a backend for multi-device sync and user accounts.

## Decision

No backend. No authentication. All data lives in the browser's `localStorage`.

## Rationale

- Zero infrastructure: no server to deploy, no database to manage, no credentials to secure
- Instant startup: no API latency, no loading states
- Works offline by default
- The primary use case is a single user on a single device
- Data survives page refreshes and browser restarts via `localStorage`

## Limitations and future path

- Data is not synced across devices or browsers
- Clearing localStorage or switching browsers loses data
- No sharing or collaboration

If multi-device sync or collaboration is needed in the future, the store's action API is the right abstraction boundary. A migration path would be:

1. Replace `persist` middleware with a backend-synced adapter (e.g. Supabase Realtime)
2. Add auth (e.g. Supabase Auth)
3. Keep all store actions identical — UI components don't need to change

The current localStorage key `kanban-v1` can be used as a local cache during the transition.
