# ADR 001: Zustand with localStorage persistence

**Status:** Accepted  
**Date:** 2026-04-24

## Context

We need client-side state management for a single-user kanban app with no backend. State must survive page refreshes.

## Decision

Use **Zustand 5** with the `persist` middleware, storing state under the localStorage key `kanban-v1`.

## Rationale

- Minimal boilerplate compared to Redux — no providers, no action creators
- Built-in `persist` middleware handles serialization/deserialization to localStorage
- Excellent TypeScript support
- Small bundle footprint (~3 KB gzipped)
- The store is testable in isolation via `useKanbanStore.setState` and `useKanbanStore.getState()`

## Schema versioning

A `schemaVersion` number is stored alongside the persisted state. When new **optional** fields are added to the data model (e.g. `link`, `comments`, `history` on cards), the `SCHEMA_VERSION` constant is incremented and a `migrateCard` function in the Zustand `persist` `merge` config fills in safe defaults for any missing fields. This allows the storage key to remain the same and preserves existing user data without a full migration.

The `merge` function checks the persisted `schemaVersion`: if it is missing or lower than the current `SCHEMA_VERSION`, migrations run; otherwise they are skipped entirely. This makes hydration O(1) in the common case where the schema is up to date, instead of O(n) over all cards.

If the stored state shape changes in a **breaking** way (fields renamed, nested structure changed beyond what `migrateCard` can reconcile), the storage key should be incremented to `kanban-v2` and a migration function added using Zustand's `migrate` option. Do not silently break existing user data.

### Migration pattern

The `merge` function in the persist config:

1. Validates that the persisted state has the expected top-level keys (`boardIds`, `boards`, `columns`, `cards`). If validation fails, the persisted state is discarded and defaults are used.
2. Checks `schemaVersion` on the persisted state. If it is missing or lower than the current `SCHEMA_VERSION`, iterates over all persisted cards and passes each through `migrateCard`, which supplies defaults for any fields that were added after the initial schema (e.g. `link: null`, `comments: []`, `history: []`). This ensures old data loads cleanly alongside new code. If the version is current, this step is skipped.
3. Sets `schemaVersion` on the merged state to the current `SCHEMA_VERSION`.

## Alternatives considered

- **React Context + useReducer**: No persistence story; would require manual localStorage wiring
- **Redux Toolkit**: More boilerplate than needed for a single-user app with no async concerns
- **Jotai**: Atom-based model doesn't map as cleanly to a relational entity store (boards → columns → cards)
