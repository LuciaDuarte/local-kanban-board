import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { BoardView } from './components/BoardView'
import { CardModal } from './components/CardModal'
import { useKanbanStore } from './store/kanban'
import { useNow } from './hooks/useNow'

function App() {
  const activeBoardId = useKanbanStore((s) => s.activeBoardId)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const now = useNow()

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {activeBoardId ? (
          <BoardView
            boardId={activeBoardId}
            onCardClick={setActiveCardId}
            now={now}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 select-none">
            <div className="text-center space-y-2">
              <p className="text-2xl font-light">No board selected</p>
              <p className="text-sm">
                Create a board in the sidebar to get started.
              </p>
            </div>
          </div>
        )}
      </main>

      {activeCardId && (
        <CardModal
          cardId={activeCardId}
          onClose={() => setActiveCardId(null)}
        />
      )}
    </div>
  )
}

export default App
