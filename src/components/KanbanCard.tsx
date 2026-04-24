import type { Card as CardType } from '../store/types'
import { CardContent } from './CardContent'

type Props = {
  card: CardType
  onClick: () => void
  /** Current timestamp snapshot from the parent render. */
  now: number
}

/**
 * A non-draggable card used in the DragOverlay ghost.
 * Wraps CardContent with click handling.
 */
export function KanbanCard({ card, onClick, now }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
    >
      <CardContent card={card} now={now} />
    </button>
  )
}
