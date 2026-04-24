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

  it('moves a card within a 3-card column without duplicating it', () => {
    const { colId } = setup()
    useKanbanStore.getState().createCard(colId, 'A')
    useKanbanStore.getState().createCard(colId, 'B')
    useKanbanStore.getState().createCard(colId, 'C')
    const [idA, idB, idC] = useKanbanStore.getState().columns[colId].cardIds
    // Move A (index 0) to index 2
    useKanbanStore.getState().moveCard(idA, colId, colId, 2)
    const result = useKanbanStore.getState().columns[colId].cardIds
    expect(result).toHaveLength(3)
    expect(result).toEqual([idB, idC, idA])
  })

  it('moves a card between columns', () => {
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
