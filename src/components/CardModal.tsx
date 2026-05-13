import { useCallback, useEffect, useRef, useState } from 'react'
import { useKanbanStore } from '../store/kanban'
import { LABEL_COLORS } from '../constants/labels'
import { CardComments } from './CardComments'
import { CardActivity } from './CardActivity'

type Props = {
  cardId: string
  onClose: () => void
}

/** Normalizes a raw URL string: trims whitespace, auto-prepends https:// if no protocol, returns null for empty strings. */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/**
 * Modal dialog for viewing and editing a card's full details:
 * title, description, link, labels, due date, comments, and activity history.
 * Supports a full-screen expand/collapse toggle.
 * Traps focus and closes on Escape or backdrop click.
 */
export function CardModal({ cardId, onClose }: Props) {
  const {
    cards,
    columns,
    updateCard,
    deleteCard,
    addComment,
    deleteComment,
    editComment,
  } = useKanbanStore()
  const card = cards[cardId]
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = `card-modal-title-${cardId}`
  const [title, setTitle] = useState(card?.title ?? '')
  const [description, setDescription] = useState(card?.description ?? '')
  const [dueDate, setDueDate] = useState(card?.dueDate ?? '')
  const [link, setLink] = useState(card?.link ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const getColumnName = useCallback(
    (colId: string) => columns[colId]?.title ?? '(deleted column)',
    [columns]
  )

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
  }, [isExpanded])

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

  function handleLinkBlur() {
    const normalized = normalizeUrl(link)
    if (normalized !== card.link) updateCard(cardId, { link: normalized })
  }

  function handleDelete() {
    if (owningColumnId) deleteCard(owningColumnId, cardId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto transition-all ${
          isExpanded
            ? 'w-full h-full rounded-none'
            : 'rounded-xl w-full max-w-lg max-h-[90vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <textarea
            id={titleId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            rows={2}
            maxLength={100}
            className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100 bg-transparent outline-none resize-none leading-snug"
            aria-label="Card title"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isExpanded ? (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 8h10M8 3v10" strokeLinecap="round" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M2 2h5M2 2v5M14 14h-5M14 14v-5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
              maxLength={5000}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 resize-none transition-colors"
              aria-label="Card description"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 text-right">
              {description.length.toLocaleString()} / 5,000
            </p>
          </div>

          {/* Link */}
          <div>
            <label
              htmlFor="card-link"
              className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide"
            >
              Link
            </label>
            <div className="flex items-center gap-2">
              <input
                id="card-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onBlur={handleLinkBlur}
                placeholder="https://example.com"
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 transition-colors"
              />
              {card.link && (
                <a
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  aria-label="Open link"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M10 2h4v4M14 2L8 8M6 3H4a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2v-2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
              {card.link && (
                <button
                  onClick={() => {
                    setLink('')
                    updateCard(cardId, { link: null })
                  }}
                  aria-label="Clear link"
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label
              htmlFor="due-date"
              className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide"
            >
              Due date
            </label>
            <div className="flex items-center gap-2">
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
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
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

          {/* Comments */}
          <CardComments
            cardId={cardId}
            comments={card.comments}
            addComment={addComment}
            deleteComment={deleteComment}
            editComment={editComment}
          />

          {/* Activity */}
          <CardActivity history={card.history} getColumnName={getColumnName} />
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
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Delete this card?
              </span>
              <button
                onClick={handleDelete}
                className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete card
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
