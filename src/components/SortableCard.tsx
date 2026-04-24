import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '../store/types'
import { CardContent } from './CardContent'

type Props = {
  card: Card
  onClick: () => void
  isDragging?: boolean
  /** Current timestamp snapshot from the parent render. */
  now: number
}

/**
 * A draggable card within a SortableContext.
 * Wraps CardContent with dnd-kit drag wiring.
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

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <button
        {...listeners}
        type="button"
        onClick={onClick}
        className="group w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
      >
        <CardContent card={card} now={now} />
      </button>
    </div>
  )
}
