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

The storage key is versioned (`kanban-v1`). If the stored state shape changes in a breaking way (fields renamed, nested structure changed), increment the key to `kanban-v2` and add a migration function using Zustand's `migrate` option in the `persist` config. Do not silently break existing user data.

## Alternatives considered

- **React Context + useReducer**: No persistence story; would require manual localStorage wiring
- **Redux Toolkit**: More boilerplate than needed for a single-user app with no async concerns
- **Jotai**: Atom-based model doesn't map as cleanly to a relational entity store (boards → columns → cards)
