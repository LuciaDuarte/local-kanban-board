/** A color label that can be attached to a card. */
export type Label = {
  id: string
  name: string
  color: string
}

/** A single kanban card. */
export type Card = {
  id: string
  title: string
  description: string
  labelIds: string[]
  dueDate: string | null
  createdAt: string
}

/** A column within a board (e.g. "To Do", "In Progress"). */
export type Column = {
  id: string
  title: string
  cardIds: string[]
}

/** A kanban board containing an ordered list of columns. */
export type Board = {
  id: string
  title: string
  columnIds: string[]
  createdAt: string
}

/** The full persisted state shape. */
export type KanbanState = {
  /** Ordered list of board IDs for sidebar display. */
  boardIds: string[]
  boards: Record<string, Board>
  columns: Record<string, Column>
  cards: Record<string, Card>
  labels: Record<string, Label>
  /** The currently active board ID, or null if none selected. */
  activeBoardId: string | null

  // Board actions
  createBoard: (title: string) => void
  renameBoard: (boardId: string, title: string) => void
  deleteBoard: (boardId: string) => void
  setActiveBoard: (boardId: string | null) => void

  // Column actions
  createColumn: (boardId: string, title: string) => void
  renameColumn: (columnId: string, title: string) => void
  deleteColumn: (boardId: string, columnId: string) => void
  reorderColumns: (boardId: string, columnIds: string[]) => void

  // Card actions
  createCard: (columnId: string, title: string) => void
  updateCard: (
    cardId: string,
    patch: Partial<Omit<Card, 'id' | 'createdAt'>>
  ) => void
  deleteCard: (columnId: string, cardId: string) => void
  moveCard: (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number
  ) => void
  reorderCards: (columnId: string, cardIds: string[]) => void
}
