import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useKanbanStore } from '../store/kanban'
import { SortableColumn } from './SortableColumn'
import { KanbanCard } from './KanbanCard'

type Props = {
  boardId: string
  onCardClick: (cardId: string) => void
}

/**
 * Renders the full board with drag-and-drop support.
 * Columns are horizontally sortable. Cards are sortable within and across columns.
 */
export function BoardView({ boardId, onCardClick }: Props) {
  const {
    boards,
    cards,
    columns,
    createColumn,
    reorderColumns,
    moveCard,
    reorderCards,
  } = useKanbanStore()
  const board = boards[boardId]

  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/purity -- Date.now() is used for stable display, not reactive state
  const now = useMemo(() => Date.now(), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  if (!board) return null

  // Collect all card IDs across all columns for collision detection
  const allCardIds = board.columnIds.flatMap(
    (cid) => columns[cid]?.cardIds ?? []
  )

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    if (allCardIds.includes(id)) {
      setActiveCardId(id)
    } else if (board.columnIds.includes(id)) {
      setActiveColumnId(id)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Only handle card-over-column or card-over-card
    if (!allCardIds.includes(activeId)) return

    const activeColumnId = Object.values(columns).find((col) =>
      col.cardIds.includes(activeId)
    )?.id
    if (!activeColumnId) return

    // Determine target column: either the column directly, or the column of the card hovered over
    const targetColumnId = board.columnIds.includes(overId)
      ? overId
      : (Object.values(columns).find((col) => col.cardIds.includes(overId))
          ?.id ?? null)

    if (!targetColumnId || activeColumnId === targetColumnId) return

    // Move to end of target column on drag-over (dnd-kit will handle precise index)
    const targetCardIds = columns[targetColumnId].cardIds
    const toIndex = targetCardIds.length
    moveCard(activeId, activeColumnId, targetColumnId, toIndex)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCardId(null)
    setActiveColumnId(null)

    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Column reorder
    if (
      board.columnIds.includes(activeId) &&
      board.columnIds.includes(overId)
    ) {
      const oldIndex = board.columnIds.indexOf(activeId)
      const newIndex = board.columnIds.indexOf(overId)
      reorderColumns(boardId, arrayMove(board.columnIds, oldIndex, newIndex))
      return
    }

    // Card reorder within same column
    const activeCol = Object.values(columns).find((col) =>
      col.cardIds.includes(activeId)
    )
    const overCol = Object.values(columns).find(
      (col) => col.cardIds.includes(overId) || col.id === overId
    )

    if (!activeCol || !overCol) return

    if (activeCol.id === overCol.id) {
      const cardIds = activeCol.cardIds
      const oldIndex = cardIds.indexOf(activeId)
      const newIndex = cardIds.includes(overId)
        ? cardIds.indexOf(overId)
        : cardIds.length
      if (oldIndex !== newIndex) {
        reorderCards(activeCol.id, arrayMove(cardIds, oldIndex, newIndex))
      }
    } else {
      // Cross-column: position precisely on drop
      const toIndex = overCol.cardIds.includes(overId)
        ? overCol.cardIds.indexOf(overId)
        : overCol.cardIds.length
      moveCard(activeId, activeCol.id, overCol.id, toIndex)
    }
  }

  function handleAddColumn() {
    const title = newColumnTitle.trim()
    if (title) createColumn(boardId, title)
    setNewColumnTitle('')
    setIsAddingColumn(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAddColumn()
    if (e.key === 'Escape') {
      setNewColumnTitle('')
      setIsAddingColumn(false)
    }
  }

  const draggedCard = activeCardId ? cards[activeCardId] : null

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {board.title}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {board.columnIds.length} column
          {board.columnIds.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Columns with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 h-full items-start">
            <SortableContext
              items={board.columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {board.columnIds.length === 0 ? (
                <div className="flex items-center justify-center w-full h-48 text-gray-400 dark:text-gray-600 text-sm">
                  No columns yet. Add one to get started.
                </div>
              ) : (
                board.columnIds.map((colId) => (
                  <SortableColumn
                    key={colId}
                    columnId={colId}
                    boardId={boardId}
                    onCardClick={onCardClick}
                    isDraggingColumn={activeColumnId === colId}
                  />
                ))
              )}
            </SortableContext>

            {/* Add column */}
            {isAddingColumn ? (
              <div className="w-72 shrink-0">
                <input
                  autoFocus
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onBlur={handleAddColumn}
                  onKeyDown={handleKeyDown}
                  placeholder="Column name"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                />
              </div>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-72 shrink-0 flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 dark:text-gray-500 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                </svg>
                Add column
              </button>
            )}
          </div>
        </div>

        {/* Drag overlay: ghost card while dragging */}
        <DragOverlay>
          {draggedCard && (
            <div className="rotate-1 opacity-90">
              <KanbanCard card={draggedCard} onClick={() => {}} now={now} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
