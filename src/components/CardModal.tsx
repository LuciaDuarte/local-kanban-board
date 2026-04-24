import { useEffect, useRef, useState } from 'react'
import { useKanbanStore } from '../store/kanban'

type Props = {
  cardId: string
  onClose: () => void
}

const LABEL_COLORS = [
  { name: 'Red', value: 'red', bg: 'bg-red-500' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-500' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-400' },
  { name: 'Green', value: 'green', bg: 'bg-green-500' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-500' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-500' },
]

/**
 * Modal dialog for viewing and editing a card's full details:
 * title, description, labels, and due date.
 * Traps focus and closes on Escape or backdrop click.
 */
export function CardModal({ cardId, onClose }: Props) {
  const { cards, updateCard, deleteCard, columns } = useKanbanStore()
  const card = cards[cardId]
  const dialogRef = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState(card?.title ?? '')
  const [description, setDescription] = useState(card?.description ?? '')
  const [dueDate, setDueDate] = useState(card?.dueDate ?? '')

  // Find which column owns this card (for delete)
  const owningColumnId = Object.values(columns).find((col) =>
    col.cardIds.includes(cardId)
  )?.id

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Focus trap
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    el.addEventListener('keydown', trap)
    return () => el.removeEventListener('keydown', trap)
  }, [])

  if (!card) return null

  function handleTitleBlur() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== card.title)
      updateCard(cardId, { title: trimmed })
    else setTitle(card.title)
  }

  function handleDescriptionBlur() {
    if (description !== card.description) updateCard(cardId, { description })
  }

  function handleDueDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setDueDate(value)
    updateCard(cardId, { dueDate: value || null })
  }

  function handleToggleLabel(labelId: string) {
    const next = card.labelIds.includes(labelId)
      ? card.labelIds.filter((id) => id !== labelId)
      : [...card.labelIds, labelId]
    updateCard(cardId, { labelIds: next })
  }

  function handleDelete() {
    if (owningColumnId) deleteCard(owningColumnId, cardId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Card details"
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            rows={2}
            maxLength={100}
            className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100 bg-transparent outline-none resize-none leading-snug"
            aria-label="Card title"
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add a description…"
              rows={4}
              maxLength={200}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 resize-none transition-colors"
              aria-label="Card description"
            />
          </div>

          {/* Due date */}
          <div>
            <label
              htmlFor="due-date"
              className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide"
            >
              Due date
            </label>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={handleDueDateChange}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 transition-colors"
            />
            {dueDate && (
              <button
                onClick={() => {
                  setDueDate('')
                  updateCard(cardId, { dueDate: null })
                }}
                className="ml-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Labels */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Labels
            </p>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLORS.map((label) => {
                const isActive = card.labelIds.includes(label.value)
                return (
                  <button
                    key={label.value}
                    onClick={() => handleToggleLabel(label.value)}
                    aria-pressed={isActive}
                    aria-label={`Toggle ${label.name} label`}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? 'border-transparent text-white ' + label.bg
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${isActive ? 'bg-white/60' : label.bg}`}
                    />
                    {label.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Created{' '}
            {new Date(card.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete card
          </button>
        </div>
      </div>
    </div>
  )
}
