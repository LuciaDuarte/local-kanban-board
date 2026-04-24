import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KanbanState, Board, Column, Card } from './types'
import { generateId } from '../utils/id'

/**
 * The main Zustand store for the kanban board.
 * Persisted to localStorage under the key 'kanban-v1'.
 *
 * Schema versioning note: if the shape of KanbanState changes in a breaking way,
 * increment the storage key (e.g. 'kanban-v2') and add a migration. See ADR 003.
 */
export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      boardIds: [],
      boards: {},
      columns: {},
      cards: {},
      labels: {},
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
        set((state) => ({
          boards: {
            ...state.boards,
            [boardId]: { ...state.boards[boardId], title },
          },
        })),

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
            state.activeBoardId === boardId ? (nextBoardIds[0] ?? null) : state.activeBoardId

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
        set((state) => ({
          columns: {
            ...state.columns,
            [columnId]: { ...state.columns[columnId], title },
          },
        })),

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
                columnIds: state.boards[boardId].columnIds.filter((id) => id !== columnId),
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

      /** Creates a new card at the end of a column. */
      createCard: (columnId, title) =>
        set((state) => {
          const id = generateId()
          const card: Card = {
            id,
            title,
            description: '',
            labelIds: [],
            dueDate: null,
            createdAt: new Date().toISOString(),
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

      /** Updates fields on a card. */
      updateCard: (cardId, patch) =>
        set((state) => ({
          cards: {
            ...state.cards,
            [cardId]: { ...state.cards[cardId], ...patch },
          },
        })),

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
                cardIds: state.columns[columnId].cardIds.filter((id) => id !== cardId),
              },
            },
          }
        }),

      /**
       * Moves a card from one column to another at a specific index.
       * Used by drag-and-drop to update state after a drop.
       */
      moveCard: (cardId, fromColumnId, toColumnId, toIndex) =>
        set((state) => {
          const fromCardIds = state.columns[fromColumnId].cardIds.filter((id) => id !== cardId)
          const toCardIds = [...state.columns[toColumnId].cardIds]

          // If moving within the same column, fromCardIds already has the card removed
          if (fromColumnId === toColumnId) {
            toCardIds.splice(
              toCardIds.findIndex((id) => id === cardId),
              1
            )
          }

          toCardIds.splice(toIndex, 0, cardId)

          return {
            columns: {
              ...state.columns,
              [fromColumnId]: { ...state.columns[fromColumnId], cardIds: fromCardIds },
              [toColumnId]: { ...state.columns[toColumnId], cardIds: toCardIds },
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
    }),
    {
      name: 'kanban-v1',
    }
  )
)
