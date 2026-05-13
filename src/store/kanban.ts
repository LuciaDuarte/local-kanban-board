import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KanbanState, Board, Column, Card, HistoryEvent } from './types'
import { generateId } from '../utils/id'

/**
 * Migrates a persisted card (which may be missing fields added later)
 * into a complete Card object with safe defaults.
 */
function migrateCard(card: Card & Record<string, unknown>): Card {
  return {
    id: card.id,
    title: card.title ?? '',
    description: card.description ?? '',
    labelIds: Array.isArray(card.labelIds) ? card.labelIds : [],
    dueDate: card.dueDate ?? null,
    createdAt: card.createdAt ?? new Date().toISOString(),
    link: card.link ?? null,
    comments: Array.isArray(card.comments) ? card.comments : [],
    history: Array.isArray(card.history) ? card.history : [],
  }
}

/**
 * The main Zustand store for the kanban board.
 * Persisted to localStorage under the key 'kanban-v1'.
 *
 * Schema versioning note: if the shape of KanbanState changes in a breaking way,
 * increment the storage key (e.g. 'kanban-v2') and add a migration. See ADR 001.
 */
export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      boardIds: [],
      boards: {},
      columns: {},
      cards: {},
      activeBoardId: null,

      // --- Board actions ---

      /** Creates a new board and sets it as active. */
      createBoard: (title) =>
        set((state) => {
          const id = generateId()
          const board: Board = {
            id,
            title,
            columnIds: [],
            createdAt: new Date().toISOString(),
          }
          return {
            boardIds: [...state.boardIds, id],
            boards: { ...state.boards, [id]: board },
            activeBoardId: id,
          }
        }),

      /** Renames an existing board. */
      renameBoard: (boardId, title) =>
        set((state) => {
          if (!state.boards[boardId]) return state
          return {
            boards: {
              ...state.boards,
              [boardId]: { ...state.boards[boardId], title },
            },
          }
        }),

      /** Deletes a board and all its columns and cards. */
      deleteBoard: (boardId) =>
        set((state) => {
          const board = state.boards[boardId]
          if (!board) return state

          const columnIds = board.columnIds
          const cardIdsToDelete = columnIds.flatMap(
            (cid) => state.columns[cid]?.cardIds ?? []
          )

          const nextBoards = { ...state.boards }
          delete nextBoards[boardId]

          const nextColumns = { ...state.columns }
          columnIds.forEach((cid) => delete nextColumns[cid])

          const nextCards = { ...state.cards }
          cardIdsToDelete.forEach((cardId) => delete nextCards[cardId])

          const nextBoardIds = state.boardIds.filter((id) => id !== boardId)
          const nextActiveId =
            state.activeBoardId === boardId
              ? (nextBoardIds[0] ?? null)
              : state.activeBoardId

          return {
            boardIds: nextBoardIds,
            boards: nextBoards,
            columns: nextColumns,
            cards: nextCards,
            activeBoardId: nextActiveId,
          }
        }),

      /** Sets the currently viewed board. */
      setActiveBoard: (boardId) => set({ activeBoardId: boardId }),

      // --- Column actions ---

      /** Creates a new column on the given board. */
      createColumn: (boardId, title) =>
        set((state) => {
          const id = generateId()
          const column: Column = { id, title, cardIds: [] }
          return {
            columns: { ...state.columns, [id]: column },
            boards: {
              ...state.boards,
              [boardId]: {
                ...state.boards[boardId],
                columnIds: [...state.boards[boardId].columnIds, id],
              },
            },
          }
        }),

      /** Renames a column. */
      renameColumn: (columnId, title) =>
        set((state) => {
          if (!state.columns[columnId]) return state
          return {
            columns: {
              ...state.columns,
              [columnId]: { ...state.columns[columnId], title },
            },
          }
        }),

      /** Deletes a column and all its cards from the board. */
      deleteColumn: (boardId, columnId) =>
        set((state) => {
          const column = state.columns[columnId]
          if (!column) return state

          const nextColumns = { ...state.columns }
          delete nextColumns[columnId]

          const nextCards = { ...state.cards }
          column.cardIds.forEach((cardId) => delete nextCards[cardId])

          return {
            columns: nextColumns,
            cards: nextCards,
            boards: {
              ...state.boards,
              [boardId]: {
                ...state.boards[boardId],
                columnIds: state.boards[boardId].columnIds.filter(
                  (id) => id !== columnId
                ),
              },
            },
          }
        }),

      /** Reorders columns on a board by providing a new ordered array of column IDs. */
      reorderColumns: (boardId, columnIds) =>
        set((state) => ({
          boards: {
            ...state.boards,
            [boardId]: { ...state.boards[boardId], columnIds },
          },
        })),

      // --- Card actions ---

      /** Creates a new card at the end of a column. Appends a 'created' history event. */
      createCard: (columnId, title) =>
        set((state) => {
          const id = generateId()
          const now = new Date().toISOString()
          const card: Card = {
            id,
            title,
            description: '',
            labelIds: [],
            dueDate: null,
            createdAt: now,
            link: null,
            comments: [],
            history: [
              { id: generateId(), type: 'created', columnId, timestamp: now },
            ],
          }
          return {
            cards: { ...state.cards, [id]: card },
            columns: {
              ...state.columns,
              [columnId]: {
                ...state.columns[columnId],
                cardIds: [...state.columns[columnId].cardIds, id],
              },
            },
          }
        }),

      /** Updates fields on a card. History is not patchable here; it is auto-managed. */
      updateCard: (cardId, patch) =>
        set((state) => {
          if (!state.cards[cardId]) return state
          return {
            cards: {
              ...state.cards,
              [cardId]: { ...state.cards[cardId], ...patch },
            },
          }
        }),

      /** Deletes a card from a column. */
      deleteCard: (columnId, cardId) =>
        set((state) => {
          const nextCards = { ...state.cards }
          delete nextCards[cardId]
          return {
            cards: nextCards,
            columns: {
              ...state.columns,
              [columnId]: {
                ...state.columns[columnId],
                cardIds: state.columns[columnId].cardIds.filter(
                  (id) => id !== cardId
                ),
              },
            },
          }
        }),

      /**
       * Moves a card from one column to another at a specific index.
       * Used by drag-and-drop to update state after a drop.
       * Cross-column moves append a 'moved' history event to the card.
       */
      moveCard: (cardId, fromColumnId, toColumnId, toIndex) =>
        set((state) => {
          if (fromColumnId === toColumnId) {
            // Same-column reorder: remove from current position, insert at target index
            const cardIds = state.columns[fromColumnId].cardIds.filter(
              (id) => id !== cardId
            )
            cardIds.splice(toIndex, 0, cardId)
            return {
              columns: {
                ...state.columns,
                [fromColumnId]: { ...state.columns[fromColumnId], cardIds },
              },
            }
          }

          // Cross-column move: transfer card and record in history
          const fromCardIds = state.columns[fromColumnId].cardIds.filter(
            (id) => id !== cardId
          )
          const toCardIds = [...state.columns[toColumnId].cardIds]
          toCardIds.splice(toIndex, 0, cardId)

          const card = state.cards[cardId]
          const movedEvent: HistoryEvent = {
            id: generateId(),
            type: 'moved',
            fromColumnId,
            toColumnId,
            timestamp: new Date().toISOString(),
          }

          return {
            columns: {
              ...state.columns,
              [fromColumnId]: {
                ...state.columns[fromColumnId],
                cardIds: fromCardIds,
              },
              [toColumnId]: {
                ...state.columns[toColumnId],
                cardIds: toCardIds,
              },
            },
            cards: {
              ...state.cards,
              [cardId]: {
                ...card,
                history: [...card.history, movedEvent],
              },
            },
          }
        }),

      /** Reorders cards within a column by providing a new ordered array of card IDs. */
      reorderCards: (columnId, cardIds) =>
        set((state) => ({
          columns: {
            ...state.columns,
            [columnId]: { ...state.columns[columnId], cardIds },
          },
        })),

      // --- Comment actions ---

      /** Adds a comment to a card. */
      addComment: (cardId, text) =>
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          const comment = {
            id: generateId(),
            text,
            createdAt: new Date().toISOString(),
          }
          return {
            cards: {
              ...state.cards,
              [cardId]: { ...card, comments: [...card.comments, comment] },
            },
          }
        }),

      /** Deletes a comment from a card. */
      deleteComment: (cardId, commentId) =>
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return {
            cards: {
              ...state.cards,
              [cardId]: {
                ...card,
                comments: card.comments.filter((c) => c.id !== commentId),
              },
            },
          }
        }),

      /** Edits the text of an existing comment on a card. */
      editComment: (cardId, commentId, text) =>
        set((state) => {
          const card = state.cards[cardId]
          if (!card) return state
          return {
            cards: {
              ...state.cards,
              [cardId]: {
                ...card,
                comments: card.comments.map((c) =>
                  c.id === commentId ? { ...c, text } : c
                ),
              },
            },
          }
        }),
    }),
    {
      name: 'kanban-v1',
      /**
       * Validate hydrated state before merging. If the persisted value is missing
       * required top-level keys (e.g. corrupted or from an incompatible schema),
       * discard it and start fresh rather than crashing at runtime.
       * Migrates old cards that are missing link, comments, or history fields.
       */
      merge: (persisted, current) => {
        if (
          persisted === null ||
          typeof persisted !== 'object' ||
          !Array.isArray((persisted as Record<string, unknown>).boardIds) ||
          typeof (persisted as Record<string, unknown>).boards !== 'object' ||
          typeof (persisted as Record<string, unknown>).columns !== 'object' ||
          typeof (persisted as Record<string, unknown>).cards !== 'object'
        ) {
          console.warn(
            '[kanban] Persisted state failed validation — resetting to defaults.'
          )
          return current
        }

        const merged = { ...current, ...(persisted as Partial<KanbanState>) }

        if (merged.cards && typeof merged.cards === 'object') {
          const migratedCards: Record<string, Card> = {}
          for (const [id, card] of Object.entries(merged.cards)) {
            migratedCards[id] = migrateCard(
              card as Card & Record<string, unknown>
            )
          }
          merged.cards = migratedCards
        }

        return merged
      },
    }
  )
)
