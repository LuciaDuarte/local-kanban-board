import { describe, it, expect, beforeEach } from 'vitest'
import { useKanbanStore } from './kanban'

/** Reset store state before each test to avoid cross-test pollution. */
function resetStore() {
  useKanbanStore.setState({
    boardIds: [],
    boards: {},
    columns: {},
    cards: {},
    activeBoardId: null,
  })
}

describe('Board actions', () => {
  beforeEach(resetStore)

  it('creates a board and sets it as active', () => {
    useKanbanStore.getState().createBoard('My Board')
    const state = useKanbanStore.getState()
    expect(state.boardIds).toHaveLength(1)
    const id = state.boardIds[0]
    expect(state.boards[id].title).toBe('My Board')
    expect(state.activeBoardId).toBe(id)
  })

  it('renames a board', () => {
    useKanbanStore.getState().createBoard('Old Name')
    const id = useKanbanStore.getState().boardIds[0]
    useKanbanStore.getState().renameBoard(id, 'New Name')
    expect(useKanbanStore.getState().boards[id].title).toBe('New Name')
  })

  it('deletes a board and cascades to columns and cards', () => {
    const { createBoard, createColumn, createCard, deleteBoard } =
      useKanbanStore.getState()
    createBoard('Board')
    const boardId = useKanbanStore.getState().boardIds[0]
    createColumn(boardId, 'Col')
    const colId = useKanbanStore.getState().boards[boardId].columnIds[0]
    createCard(colId, 'Card')

    deleteBoard(boardId)

    const state = useKanbanStore.getState()
    expect(state.boardIds).toHaveLength(0)
    expect(state.boards[boardId]).toBeUndefined()
    expect(state.columns[colId]).toBeUndefined()
    expect(Object.keys(state.cards)).toHaveLength(0)
  })

  it('sets the next board as active when the active board is deleted', () => {
    useKanbanStore.getState().createBoard('Board A')
    useKanbanStore.getState().createBoard('Board B')
    const [idA, idB] = useKanbanStore.getState().boardIds
    useKanbanStore.getState().setActiveBoard(idA)
    useKanbanStore.getState().deleteBoard(idA)
    expect(useKanbanStore.getState().activeBoardId).toBe(idB)
  })

  it('sets activeBoardId to null when deleting the last board', () => {
    useKanbanStore.getState().createBoard('Solo')
    const id = useKanbanStore.getState().boardIds[0]
    useKanbanStore.getState().deleteBoard(id)
    expect(useKanbanStore.getState().activeBoardId).toBeNull()
  })
})

describe('Column actions', () => {
  beforeEach(resetStore)

  it('creates a column on a board', () => {
    useKanbanStore.getState().createBoard('Board')
    const boardId = useKanbanStore.getState().boardIds[0]
    useKanbanStore.getState().createColumn(boardId, 'To Do')
    const state = useKanbanStore.getState()
    expect(state.boards[boardId].columnIds).toHaveLength(1)
    const colId = state.boards[boardId].columnIds[0]
    expect(state.columns[colId].title).toBe('To Do')
  })

  it('renames a column', () => {
    useKanbanStore.getState().createBoard('Board')
    const boardId = useKanbanStore.getState().boardIds[0]
    useKanbanStore.getState().createColumn(boardId, 'Old')
    const colId = useKanbanStore.getState().boards[boardId].columnIds[0]
    useKanbanStore.getState().renameColumn(colId, 'New')
    expect(useKanbanStore.getState().columns[colId].title).toBe('New')
  })

  it('deletes a column and its cards', () => {
    useKanbanStore.getState().createBoard('Board')
    const boardId = useKanbanStore.getState().boardIds[0]
    useKanbanStore.getState().createColumn(boardId, 'Col')
    const colId = useKanbanStore.getState().boards[boardId].columnIds[0]
    useKanbanStore.getState().createCard(colId, 'Card')
    useKanbanStore.getState().deleteColumn(boardId, colId)
    const state = useKanbanStore.getState()
    expect(state.boards[boardId].columnIds).toHaveLength(0)
    expect(state.columns[colId]).toBeUndefined()
    expect(Object.keys(state.cards)).toHaveLength(0)
  })

  it('reorders columns', () => {
    useKanbanStore.getState().createBoard('Board')
    const boardId = useKanbanStore.getState().boardIds[0]
    useKanbanStore.getState().createColumn(boardId, 'A')
    useKanbanStore.getState().createColumn(boardId, 'B')
    const [idA, idB] = useKanbanStore.getState().boards[boardId].columnIds
    useKanbanStore.getState().reorderColumns(boardId, [idB, idA])
    expect(useKanbanStore.getState().boards[boardId].columnIds).toEqual([
      idB,
      idA,
    ])
  })
})

describe('Card actions', () => {
  beforeEach(resetStore)

  function setup() {
    useKanbanStore.getState().createBoard('Board')
    const boardId = useKanbanStore.getState().boardIds[0]
    useKanbanStore.getState().createColumn(boardId, 'Col')
    const colId = useKanbanStore.getState().boards[boardId].columnIds[0]
    return { boardId, colId }
  }

  it('creates a card in a column', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'My Card')
    const state = useKanbanStore.getState()
    const cardId = state.columns[colId].cardIds[0]
    expect(state.cards[cardId].title).toBe('My Card')
    expect(state.cards[cardId].description).toBe('')
    expect(state.cards[cardId].dueDate).toBeNull()
  })

  it('creates a card with a history event', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'My Card')
    const state = useKanbanStore.getState()
    const cardId = state.columns[colId].cardIds[0]
    const card = state.cards[cardId]
    expect(card.history).toHaveLength(1)
    expect(card.history[0].type).toBe('created')
    if (card.history[0].type === 'created') {
      expect(card.history[0].columnId).toBe(colId)
    }
  })

  it('creates a card with link and comments defaults', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'Card')
    const state = useKanbanStore.getState()
    const cardId = state.columns[colId].cardIds[0]
    expect(state.cards[cardId].link).toBeNull()
    expect(state.cards[cardId].comments).toEqual([])
  })

  it('updates card fields', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'Card')
    const cardId = useKanbanStore.getState().columns[colId].cardIds[0]
    useKanbanStore
      .getState()
      .updateCard(cardId, { description: 'Details', dueDate: '2026-01-01' })
    const card = useKanbanStore.getState().cards[cardId]
    expect(card.description).toBe('Details')
    expect(card.dueDate).toBe('2026-01-01')
  })

  it('updates card link', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'Card')
    const cardId = useKanbanStore.getState().columns[colId].cardIds[0]
    useKanbanStore
      .getState()
      .updateCard(cardId, { link: 'https://example.com' })
    expect(useKanbanStore.getState().cards[cardId].link).toBe(
      'https://example.com'
    )
  })

  it('deletes a card', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'Card')
    const cardId = useKanbanStore.getState().columns[colId].cardIds[0]
    useKanbanStore.getState().deleteCard(colId, cardId)
    const state = useKanbanStore.getState()
    expect(state.columns[colId].cardIds).toHaveLength(0)
    expect(state.cards[cardId]).toBeUndefined()
  })

  it('moves a card within the same column', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'A')
    useKanbanStore.getState().createCard(colId, 'B')
    const [idA, idB] = useKanbanStore.getState().columns[colId].cardIds
    useKanbanStore.getState().moveCard(idA, colId, colId, 1)
    expect(useKanbanStore.getState().columns[colId].cardIds).toEqual([idB, idA])
  })

  it('does not add a history event when reordering within the same column', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'A')
    useKanbanStore.getState().createCard(colId, 'B')
    const [idA] = useKanbanStore.getState().columns[colId].cardIds
    const historyBefore = useKanbanStore.getState().cards[idA].history.length
    useKanbanStore.getState().moveCard(idA, colId, colId, 1)
    expect(useKanbanStore.getState().cards[idA].history).toHaveLength(
      historyBefore
    )
  })

  it('moves a card within a 3-card column without duplicating it', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'A')
    useKanbanStore.getState().createCard(colId, 'B')
    useKanbanStore.getState().createCard(colId, 'C')
    const [idA, idB, idC] = useKanbanStore.getState().columns[colId].cardIds
    useKanbanStore.getState().moveCard(idA, colId, colId, 2)
    const result = useKanbanStore.getState().columns[colId].cardIds
    expect(result).toHaveLength(3)
    expect(result).toEqual([idB, idC, idA])
  })

  it('moves a card between columns and adds a history event', () => {
    useKanbanStore.getState().createBoard('Board')
    const boardId = useKanbanStore.getState().boardIds[0]
    useKanbanStore.getState().createColumn(boardId, 'A')
    useKanbanStore.getState().createColumn(boardId, 'B')
    const [colA, colB] = useKanbanStore.getState().boards[boardId].columnIds
    useKanbanStore.getState().createCard(colA, 'Card')
    const cardId = useKanbanStore.getState().columns[colA].cardIds[0]

    useKanbanStore.getState().moveCard(cardId, colA, colB, 0)

    const state = useKanbanStore.getState()
    expect(state.columns[colA].cardIds).toHaveLength(0)
    expect(state.columns[colB].cardIds).toContain(cardId)
    const card = state.cards[cardId]
    expect(card.history).toHaveLength(2)
    expect(card.history[1].type).toBe('moved')
    if (card.history[1].type === 'moved') {
      expect(card.history[1].fromColumnId).toBe(colA)
      expect(card.history[1].toColumnId).toBe(colB)
    }
  })

  it('reorders cards within a column', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'A')
    useKanbanStore.getState().createCard(colId, 'B')
    const [idA, idB] = useKanbanStore.getState().columns[colId].cardIds
    useKanbanStore.getState().reorderCards(colId, [idB, idA])
    expect(useKanbanStore.getState().columns[colId].cardIds).toEqual([idB, idA])
  })
})

describe('Comment actions', () => {
  beforeEach(resetStore)

  function setup() {
    useKanbanStore.getState().createBoard('Board')
    const boardId = useKanbanStore.getState().boardIds[0]
    useKanbanStore.getState().createColumn(boardId, 'Col')
    const colId = useKanbanStore.getState().boards[boardId].columnIds[0]
    useKanbanStore.getState().createCard(colId, 'Card')
    const cardId = useKanbanStore.getState().columns[colId].cardIds[0]
    return { boardId, colId, cardId }
  }

  it('adds a comment to a card', () => {
    const { cardId } = setup()
    useKanbanStore.getState().addComment(cardId, 'Hello world')
    const card = useKanbanStore.getState().cards[cardId]
    expect(card.comments).toHaveLength(1)
    expect(card.comments[0].text).toBe('Hello world')
    expect(card.comments[0].createdAt).toBeTruthy()
  })

  it('adds multiple comments in order', () => {
    const { cardId } = setup()
    useKanbanStore.getState().addComment(cardId, 'First')
    useKanbanStore.getState().addComment(cardId, 'Second')
    const card = useKanbanStore.getState().cards[cardId]
    expect(card.comments).toHaveLength(2)
    expect(card.comments[0].text).toBe('First')
    expect(card.comments[1].text).toBe('Second')
  })

  it('deletes a comment from a card', () => {
    const { cardId } = setup()
    useKanbanStore.getState().addComment(cardId, 'Keep')
    useKanbanStore.getState().addComment(cardId, 'Remove')
    const commentId = useKanbanStore.getState().cards[cardId].comments[1].id
    useKanbanStore.getState().deleteComment(cardId, commentId)
    const card = useKanbanStore.getState().cards[cardId]
    expect(card.comments).toHaveLength(1)
    expect(card.comments[0].text).toBe('Keep')
  })

  it('edits a comment on a card', () => {
    const { cardId } = setup()
    useKanbanStore.getState().addComment(cardId, 'Original')
    const commentId = useKanbanStore.getState().cards[cardId].comments[0].id
    useKanbanStore.getState().editComment(cardId, commentId, 'Edited')
    const card = useKanbanStore.getState().cards[cardId]
    expect(card.comments[0].text).toBe('Edited')
    expect(card.comments).toHaveLength(1)
  })
})

describe('Persistence migration', () => {
  beforeEach(resetStore)

  it('migrates old cards missing link, comments, and history fields', () => {
    const { createBoard, createColumn, createCard } = useKanbanStore.getState()
    createBoard('Board')
    const boardId = useKanbanStore.getState().boardIds[0]
    createColumn(boardId, 'Col')
    const colId = useKanbanStore.getState().boards[boardId].columnIds[0]
    createCard(colId, 'Test Card')
    const cardId = useKanbanStore.getState().columns[colId].cardIds[0]

    const card = useKanbanStore.getState().cards[cardId]
    expect(card.link).not.toBeUndefined()
    expect(card.comments).not.toBeUndefined()
    expect(card.history).not.toBeUndefined()
    expect(card.history).toHaveLength(1)
    expect(card.history[0].type).toBe('created')
  })
})
