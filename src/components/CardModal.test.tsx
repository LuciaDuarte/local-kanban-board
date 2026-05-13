import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CardModal } from './CardModal'
import { useKanbanStore } from '../store/kanban'

function resetStore() {
  useKanbanStore.setState({
    boardIds: [],
    boards: {},
    columns: {},
    cards: {},
    activeBoardId: null,
  })
}

function setupCard() {
  useKanbanStore.getState().createBoard('Board')
  const boardId = useKanbanStore.getState().boardIds[0]
  useKanbanStore.getState().createColumn(boardId, 'Col')
  const colId = useKanbanStore.getState().boards[boardId].columnIds[0]
  useKanbanStore.getState().createCard(colId, 'Test Card')
  const cardId = useKanbanStore.getState().columns[colId].cardIds[0]
  return { boardId, colId, cardId }
}

describe('CardModal', () => {
  beforeEach(resetStore)

  it('renders with role=dialog on the content panel', () => {
    const { cardId } = setupCard()
    render(<CardModal cardId={cardId} onClose={() => {}} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
  })

  it('aria-labelledby points to the title textarea', () => {
    const { cardId } = setupCard()
    render(<CardModal cardId={cardId} onClose={() => {}} />)
    const dialog = screen.getByRole('dialog')
    const labelledById = dialog.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()
    const titleEl = document.getElementById(labelledById!)
    expect(titleEl).toBeInTheDocument()
    expect((titleEl as HTMLTextAreaElement).value).toBe('Test Card')
  })

  it('calls onClose when Escape is pressed', () => {
    const { cardId } = setupCard()
    const onClose = vi.fn()
    render(<CardModal cardId={cardId} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', () => {
    const { cardId } = setupCard()
    const onClose = vi.fn()
    const { container } = render(
      <CardModal cardId={cardId} onClose={onClose} />
    )
    // The backdrop is the first child of the container
    const backdrop = container.firstChild as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close when content panel is clicked', () => {
    const { cardId } = setupCard()
    const onClose = vi.fn()
    render(<CardModal cardId={cardId} onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('updates card title on blur', () => {
    const { cardId } = setupCard()
    render(<CardModal cardId={cardId} onClose={() => {}} />)
    const titleInput = screen.getByLabelText('Card title')
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })
    fireEvent.blur(titleInput)
    expect(useKanbanStore.getState().cards[cardId].title).toBe('Updated Title')
  })

  it('deletes the card and calls onClose when Delete card is confirmed', () => {
    const { cardId, colId } = setupCard()
    const onClose = vi.fn()
    render(<CardModal cardId={cardId} onClose={onClose} />)
    // First click shows the confirm prompt
    fireEvent.click(screen.getByRole('button', { name: /delete card/i }))
    expect(screen.getByText(/delete this card\?/i)).toBeInTheDocument()
    // Second click confirms
    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }))
    expect(useKanbanStore.getState().cards[cardId]).toBeUndefined()
    expect(useKanbanStore.getState().columns[colId].cardIds).toHaveLength(0)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('cancels delete when Cancel is clicked in confirm prompt', () => {
    const { cardId } = setupCard()
    render(<CardModal cardId={cardId} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /delete card/i }))
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(useKanbanStore.getState().cards[cardId]).toBeDefined()
  })

  it('toggles a label on and off', () => {
    const { cardId } = setupCard()
    render(<CardModal cardId={cardId} onClose={() => {}} />)
    const redButton = screen.getByRole('button', { name: /toggle red label/i })
    fireEvent.click(redButton)
    expect(useKanbanStore.getState().cards[cardId].labelIds).toContain('red')
    fireEvent.click(redButton)
    expect(useKanbanStore.getState().cards[cardId].labelIds).not.toContain(
      'red'
    )
  })

  it('returns null when the card does not exist', () => {
    const { container } = render(
      <CardModal cardId="nonexistent" onClose={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  describe('comment editing', () => {
    it('edits a comment and saves', () => {
      const { cardId } = setupCard()
      useKanbanStore.getState().addComment(cardId, 'Original comment')
      render(<CardModal cardId={cardId} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Edit comment'))
      const textarea = screen.getByDisplayValue('Original comment')
      fireEvent.change(textarea, { target: { value: 'Edited comment' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(useKanbanStore.getState().cards[cardId].comments[0].text).toBe(
        'Edited comment'
      )
    })

    it('cancels editing a comment', () => {
      const { cardId } = setupCard()
      useKanbanStore.getState().addComment(cardId, 'Original comment')
      render(<CardModal cardId={cardId} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Edit comment'))
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(useKanbanStore.getState().cards[cardId].comments[0].text).toBe(
        'Original comment'
      )
    })
  })

  describe('link normalization', () => {
    it('auto-prepends https:// on blur when given a bare domain', () => {
      const { cardId } = setupCard()
      render(<CardModal cardId={cardId} onClose={() => {}} />)
      const linkInput = document.getElementById('card-link') as HTMLInputElement
      fireEvent.change(linkInput, { target: { value: 'example.com' } })
      fireEvent.blur(linkInput)
      expect(useKanbanStore.getState().cards[cardId].link).toBe(
        'https://example.com'
      )
    })

    it('keeps https:// URL as-is on blur', () => {
      const { cardId } = setupCard()
      render(<CardModal cardId={cardId} onClose={() => {}} />)
      const linkInput = document.getElementById('card-link') as HTMLInputElement
      fireEvent.change(linkInput, {
        target: { value: 'https://example.com' },
      })
      fireEvent.blur(linkInput)
      expect(useKanbanStore.getState().cards[cardId].link).toBe(
        'https://example.com'
      )
    })

    it('sets link to null on blur when input is empty', () => {
      const { cardId } = setupCard()
      render(<CardModal cardId={cardId} onClose={() => {}} />)
      const linkInput = document.getElementById('card-link') as HTMLInputElement
      fireEvent.change(linkInput, { target: { value: '' } })
      fireEvent.blur(linkInput)
      expect(useKanbanStore.getState().cards[cardId].link).toBeNull()
    })
  })

  describe('expand/collapse toggle', () => {
    it('clicking expand button adds full-width classes', () => {
      const { cardId } = setupCard()
      render(<CardModal cardId={cardId} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Expand'))
      const dialog = screen.getByRole('dialog')
      expect(dialog.classList.contains('w-full')).toBe(true)
      expect(dialog.classList.contains('h-full')).toBe(true)
    })

    it('clicking collapse button restores modal classes', () => {
      const { cardId } = setupCard()
      render(<CardModal cardId={cardId} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Expand'))
      fireEvent.click(screen.getByLabelText('Collapse'))
      const dialog = screen.getByRole('dialog')
      expect(dialog.classList.contains('max-w-lg')).toBe(true)
    })
  })
})
