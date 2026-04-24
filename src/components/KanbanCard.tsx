import type { Card as CardType } from '../store/types'
import { getDueDateStatus, formatDueDate } from '../utils/date'

type Props = {
  card: CardType
  onClick: () => void
  /** Current timestamp snapshot from the parent render. */
  now: number
}

/** A single kanban card. Shows title, optional due date badge, and label chips. */
export function KanbanCard({ card, onClick, now }: Props) {
  const { isOverdue, isDueSoon } = getDueDateStatus(card.dueDate, now)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
    >
      <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">{card.title}</p>

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
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {card.labelIds.length} label{card.labelIds.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
