# Kanban Board

A minimal, fast kanban board that runs entirely in the browser. No account, no backend, no setup — just open it and start tracking work.

## Features

- Multiple boards managed from a persistent sidebar (collapsible)
- Columns with inline rename and delete
- Cards with title, description, link, labels, due date, comments, and activity history
- Drag and drop: reorder cards within a column, move cards between columns, reorder columns
- Dark mode (persists across sessions, respects system preference on first load)
- All data stored in `localStorage` — survives page refreshes

## Tech stack

| Layer         | Choice                            |
| ------------- | --------------------------------- |
| Framework     | React 19 + TypeScript 6           |
| Build         | Vite 8                            |
| Styling       | Tailwind CSS 4                    |
| State         | Zustand 5 (localStorage persist)  |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| Testing       | Vitest + React Testing Library    |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Type-check + production build
npm run test          # Run all tests
npm run test:coverage # Run tests with coverage report
npm run lint          # Lint with ESLint
npm run format        # Format with Prettier
```

## Project structure

```
src/
  App.tsx         Root layout
  components/     UI components
    Sidebar.tsx     Board list sidebar
    BoardView.tsx   Board with DnD context
    SortableColumn.tsx  Draggable column
    SortableCard.tsx    Draggable card
    CardModal.tsx   Card detail modal (expandable)
    CardComments.tsx  Comment list and add/edit UI
    CardActivity.tsx  Activity timeline for card history events
    CardModal.test.tsx  CardModal tests
    KanbanCard.tsx  Card display (used in DragOverlay)
    CardContent.tsx Card content display
    CardContent.test.tsx CardContent tests
    InlineEdit.tsx  Click-to-edit text field
  store/
    kanban.ts       Zustand store + all actions
    types.ts        TypeScript types (Board, Column, Card, Comment, HistoryEvent, Label)
    kanban.test.ts  Store unit tests
  hooks/
    useDarkMode.ts  Dark mode toggle hook
    useNow.ts       Current timestamp hook
  utils/
    id.ts           ID generation utility
    id.test.ts      ID utility tests
    date.ts         Date formatting and history timestamp utility
    date.test.ts    Date utility tests
  constants/
    labels.ts       Label definitions
  test/
    setup.ts        Vitest + RTL setup
docs/
  adr/
    001-zustand-persist.md
    002-dnd-kit.md
    003-no-backend.md
```

## Architecture

State is a normalized entity store: `boards`, `columns`, and `cards` are each keyed by ID. Boards hold an ordered array of column IDs; columns hold an ordered array of card IDs. This makes reordering and cross-column moves O(1) on the store side.

The `DndContext` lives in `BoardView` and owns all drag event handlers. Each `SortableColumn` has its own `SortableContext` for its cards, and the board-level `SortableContext` handles column reordering. See [ADR 002](docs/adr/002-dnd-kit.md) for the collision detection strategy.

Dark mode is managed by `useDarkMode`, which toggles the `dark` class on `<html>` — this drives Tailwind's `dark:` variant. The preference is stored separately from board state under the key `kanban-theme`.

## Data persistence

All state is stored in `localStorage` under the key `kanban-v1`. A `schemaVersion` field tracks the data format version — when the persisted version is behind the current version, a `migrateCard` function in the Zustand `merge` config fills in safe defaults for any missing fields. When the schema is already current, migration is skipped entirely (O(1) instead of O(n)). If the stored state shape changes in a **breaking** way (fields renamed, nested structure changed beyond what `migrateCard` can handle), the key should be incremented to `kanban-v2` and a migration added. See [ADR 001](docs/adr/001-zustand-persist.md).

## Testing

Store actions are unit-tested in `src/store/kanban.test.ts`. Tests use `useKanbanStore.setState` to reset state before each test, avoiding cross-test pollution without needing mocks.

Coverage is enforced on `src/store/` and `src/utils/` at ≥ 80% lines and functions.

```bash
npm run test:coverage
```

## Architecture decisions

- [ADR 001: Zustand with localStorage persistence](docs/adr/001-zustand-persist.md)
- [ADR 002: dnd-kit for drag and drop](docs/adr/002-dnd-kit.md)
- [ADR 003: No backend, no auth](docs/adr/003-no-backend.md)
