import type { Card } from '../store/types'
import { getDueDateStatus, formatDueDate } from '../utils/date'
import { LABEL_COLOR_MAP } from '../constants/labels'

type Props = {
  card: Card
  /** Current timestamp for due-date status calculation. */
  now: number
}

/**
 * Shared card body rendered in both the sortable card list and the drag overlay ghost.
 * Displays title, optional due date badge, and label dots.
 */
export function CardContent({ card, now }: Props) {
  const { isOverdue, isDueSoon } = getDueDateStatus(card.dueDate, now)

  return (
    <>
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
    </>
  )
}
