import { useMemo } from 'react'
import type { HistoryEvent } from '../store/types'
import { formatHistoryTimestamp } from '../utils/date'

type Props = {
  history: HistoryEvent[]
  getColumnName: (colId: string) => string
}

function FormattedDate({ iso }: { iso: string }) {
  const formatted = useMemo(() => formatHistoryTimestamp(iso), [iso])
  return <>{formatted}</>
}

export function CardActivity({ history, getColumnName }: Props) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        Activity
      </p>
      {history.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No activity yet
        </p>
      ) : (
        <div className="space-y-2">
          {history.map((event) => (
            <div key={event.id} className="flex items-start gap-2">
              <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-gray-300 dark:bg-gray-600" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {event.type === 'created'
                    ? `Created in ${getColumnName(event.columnId)}`
                    : `Moved from ${getColumnName(event.fromColumnId)} to ${getColumnName(event.toColumnId)}`}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  <FormattedDate iso={event.timestamp} />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
