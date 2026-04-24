# ADR 002: dnd-kit for drag and drop

**Status:** Accepted  
**Date:** 2026-04-24

## Context

The board needs cards to be draggable within and between columns, and columns to be reorderable.

## Decision

Use **@dnd-kit/core** and **@dnd-kit/sortable**.

## Rationale

- Actively maintained (react-beautiful-dnd is abandoned)
- Works correctly with React 19 strict mode
- Supports pointer and keyboard sensors out of the box — meets WCAG drag-and-drop accessibility requirements
- Headless: no imposed markup or styling
- Composable via `SortableContext` — one context per column for card sorting, one outer context for column sorting

## Architecture

- `BoardView` owns the `DndContext`, `onDragStart`, `onDragOver`, and `onDragEnd` handlers
- `SortableColumn` wraps each column with a `useSortable` hook and its own `SortableContext` for its cards
- `SortableCard` wraps each card with `useSortable`
- Cross-column moves during drag-over are handled via `moveCard` in the store; final precise position is committed in `onDragEnd`
- A `DragOverlay` renders a ghost card while dragging to maintain visual continuity

## Collision detection

Uses `closestCorners` rather than `closestCenter`. This gives better results when dragging a card over a column that has cards — it detects the corner of the target card rather than the center, making column-to-column transfers feel more natural.

## Alternatives considered

- **react-beautiful-dnd**: Abandoned, broken in React strict mode
- **@hello-pangea/dnd**: Fork of rbd, maintenance unclear
- **Native HTML5 drag-and-drop**: Poor touch support, no sortable abstraction
