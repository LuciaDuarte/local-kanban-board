/** A user comment attached to a card. */
export type Comment = {
  id: string
  text: string
  createdAt: string
}

/** A record of a card's creation or move between columns. */
export type HistoryEvent =
  | {
      id: string
      /** 'created' when the card was created, 'moved' when it changed columns. */
      type: 'created'
      /** The column the card was created in. Only set for 'created' events. */
      columnId: string
      timestamp: string
    }
  | {
      id: string
      /** 'created' when the card was created, 'moved' when it changed columns. */
      type: 'moved'
      fromColumnId: string
      toColumnId: string
      timestamp: string
    }

/** A single kanban card. */
export type Card = {
  id: string
  title: string
  description: string
  labelIds: string[]
  dueDate: string | null
  createdAt: string
  /** Optional external link attached to the card. */
  link: string | null
  /** Ordered list of user comments on this card. */
  comments: Comment[]
  /** Ordered list of activity events (creation + column moves). */
  history: HistoryEvent[]
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
  /** Updates card fields. 'history' cannot be patched directly — it is managed by moveCard. */
  updateCard: (
    cardId: string,
    patch: Partial<Omit<Card, 'id' | 'createdAt' | 'history'>>
  ) => void
  deleteCard: (columnId: string, cardId: string) => void
  moveCard: (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number
  ) => void
  reorderCards: (columnId: string, cardIds: string[]) => void

  // Comment actions
  addComment: (cardId: string, text: string) => void
  deleteComment: (cardId: string, commentId: string) => void
  editComment: (cardId: string, commentId: string, text: string) => void
}
