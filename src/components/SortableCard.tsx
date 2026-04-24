import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '../store/types'
import { getDueDateStatus, formatDueDate } from '../utils/date'

const LABEL_COLOR_MAP: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
}

type Props = {
  card: Card
  onClick: () => void
  isDragging?: boolean
  /** Current timestamp snapshot from the parent render. */
  now: number
}

/**
 * A draggable card within a SortableContext.
 * Handles drag handle, due date badge, and label dots.
 */
export function SortableCard({
  card,
  onClick,
  isDragging = false,
  now,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: card.id,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const { isOverdue, isDueSoon } = getDueDateStatus(card.dueDate, now)

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        {...listeners}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        className="group w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
      >
        <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
          {card.title}
        </p>

        {(card.dueDate || card.labelIds.length > 0) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {card.dueDate && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  isOverdue
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    : isDueSoon
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {formatDueDate(card.dueDate)}
              </span>
            )}
            {card.labelIds.length > 0 && (
              <div className="flex gap-1">
                {card.labelIds.map((label) => (
                  <span
                    key={label}
                    className={`w-2 h-2 rounded-full ${LABEL_COLOR_MAP[label] ?? 'bg-gray-400'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
