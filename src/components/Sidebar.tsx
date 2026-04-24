import { useState } from 'react'
import { useKanbanStore } from '../store/kanban'
import { InlineEdit } from './InlineEdit'
import { useDarkMode } from '../hooks/useDarkMode'

/** The fixed left sidebar listing all boards with create/rename/delete controls. */
export function Sidebar() {
  const {
    boardIds,
    boards,
    activeBoardId,
    createBoard,
    renameBoard,
    deleteBoard,
    setActiveBoard,
  } = useKanbanStore()
  const { isDark, toggle } = useDarkMode()
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function handleCreate() {
    const title = newBoardTitle.trim()
    if (title) {
      createBoard(title)
      setNewBoardTitle('')
    }
    setIsCreating(false)
  }

  function handleCreateKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') {
      setNewBoardTitle('')
      setIsCreating(false)
    }
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Kanban
        </h1>
      </div>

      {/* Board list */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {boardIds.map((id) => {
          const board = boards[id]
          const isActive = id === activeBoardId
          const isPendingDelete = confirmDeleteId === id
          return (
            <div key={id} className="group flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveBoard(id)}
                  className={`flex-1 flex items-center gap-1 rounded-md px-2 py-1.5 text-left transition-colors ${
                    isActive
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="flex-1 truncate text-sm">
                    <InlineEdit
                      value={board.title}
                      onCommit={(title) => renameBoard(id, title)}
                      className="text-sm font-medium"
                      maxLength={100}
                    />
                  </span>
                </button>
                <button
                  aria-label={`Delete board ${board.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDeleteId(id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-opacity"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M2 4h12M6 4V2h4v2M5 4l1 10h4l1-10"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              {isPendingDelete && (
                <div className="flex items-center gap-1.5 px-2 pb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Delete board?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      deleteBoard(id)
                      setConfirmDeleteId(null)
                    }}
                    className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-1 py-0.5 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* New board */}
      <div className="px-2 pb-2">
        {isCreating ? (
          <input
            autoFocus
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            onBlur={handleCreate}
            onKeyDown={handleCreateKeyDown}
            placeholder="Board name"
            className="w-full px-2 py-1.5 text-sm rounded-md border border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
          />
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
            New board
          </button>
        )}
      </div>

      {/* Footer: dark mode toggle */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={toggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          {isDark ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
