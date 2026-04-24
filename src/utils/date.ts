/**
 * Returns due date display state for a card.
 * Extracted as a pure utility so it can be called from render without
 * triggering the react-hooks/purity lint rule.
 *
 * @param dueDate - ISO date string or null
 * @param now - current timestamp (pass Date.now() from caller)
 */
export function getDueDateStatus(
  dueDate: string | null,
  now: number
): { isOverdue: boolean; isDueSoon: boolean } {
  if (!dueDate) return { isOverdue: false, isDueSoon: false }
  const due = new Date(dueDate).getTime()
  const isOverdue = due < now
  const isDueSoon = !isOverdue && (due - now) / 86400000 <= 3
  return { isOverdue, isDueSoon }
}

/**
 * Formats a date string for display on a card badge.
 */
export function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
