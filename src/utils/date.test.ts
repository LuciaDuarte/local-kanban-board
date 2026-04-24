import { describe, it, expect } from 'vitest'
import { getDueDateStatus, formatDueDate } from './date'

describe('getDueDateStatus', () => {
  it('returns false/false when dueDate is null', () => {
    const result = getDueDateStatus(null, Date.now())
    expect(result).toEqual({ isOverdue: false, isDueSoon: false })
  })

  it('marks as overdue when due date is in the past', () => {
    const past = new Date(Date.now() - 86400000 * 2).toISOString()
    const result = getDueDateStatus(past, Date.now())
    expect(result.isOverdue).toBe(true)
    expect(result.isDueSoon).toBe(false)
  })

  it('marks as due soon when within 3 days', () => {
    const soon = new Date(Date.now() + 86400000 * 2).toISOString()
    const result = getDueDateStatus(soon, Date.now())
    expect(result.isOverdue).toBe(false)
    expect(result.isDueSoon).toBe(true)
  })

  it('neither overdue nor due soon when more than 3 days away', () => {
    const far = new Date(Date.now() + 86400000 * 10).toISOString()
    const result = getDueDateStatus(far, Date.now())
    expect(result.isOverdue).toBe(false)
    expect(result.isDueSoon).toBe(false)
  })
})

describe('formatDueDate', () => {
  it('formats a date string to short month + day', () => {
    // Use a fixed date for a deterministic result
    const result = formatDueDate('2026-04-24')
    expect(result).toContain('24')
    expect(typeof result).toBe('string')
  })
})
