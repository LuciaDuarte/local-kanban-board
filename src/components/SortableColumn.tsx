import { useState, useMemo } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useKanbanStore } from '../store/kanban'
import { SortableCard } from './SortableCard'
import { InlineEdit } from './InlineEdit'

type Props = {
  columnId: string
  boardId: string
  onCardClick: (cardId: string) => void
  isDraggingColumn: boolean
}

/**
 * A sortable column that wraps card list in its own SortableContext.
 * Handles column rename/delete and card creation inline.
 */
export function SortableColumn({ columnId, boardId, onCardClick, isDraggingColumn }: Props) {
  const { columns, cards, renameColumn, deleteColumn, createCard } = useKanbanStore()
  const column = columns[columnId]
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  // eslint-disable-next-line react-hooks/purity -- Date.now() is used for stable display, not reactive state
  const now = useMemo(() => Date.now(), [])

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: columnId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDraggingColumn ? 0.5 : 1,
  }

  if (!column) return null

  function handleAddCard() {
    const title = newCardTitle.trim()
    if (title) createCard(columnId, title)
    setNewCardTitle('')
    setIsAddingCard(false)
  }

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAddCard()
    if (e.key === 'Escape') {
      setNewCardTitle('')
      setIsAddingCard(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-72 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
    >
      {/* Column header — drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between px-3 pt-3 pb-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 min-w-0">
          <InlineEdit
            value={column.title}
            onCommit={(title) => renameColumn(columnId, title)}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          />
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
            {column.cardIds.length}
          </span>
        </div>
        <button
          aria-label={`Delete column ${column.title}`}
          onClick={(e) => {
            e.stopPropagation()
            deleteColumn(boardId, columnId)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2 pb-2 min-h-[40px]">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {column.cardIds.map((cardId) => {
            const card = cards[cardId]
            if (!card) return null
            return (
              <SortableCard
                key={cardId}
                card={card}
                onClick={() => onCardClick(cardId)}
                now={now}
              />
            )
          })}
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="px-2 pb-2">
        {isAddingCard ? (
          <div className="space-y-1.5">
            <textarea
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Card title"
              rows={2}
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none resize-none"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleAddCard}
                className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setNewCardTitle('')
                  setIsAddingCard(false)
                }}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
            </svg>
            Add card
          </button>
        )}
      </div>
    </div>
  )
}
