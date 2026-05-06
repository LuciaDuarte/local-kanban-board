import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardContent } from './CardContent'
import type { Card } from '../store/types'

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    title: 'Sample card',
    description: '',
    labelIds: [],
    dueDate: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// jsdom's locale can produce "M/D" instead of "Mon D"; force English short format.
const originalToLocaleDateString = Date.prototype.toLocaleDateString
beforeEach(() => {
  vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(function (
    this: Date,
    _locales?: unknown,
    options?: Intl.DateTimeFormatOptions
  ) {
    if (options?.month === 'short' && options?.day === 'numeric') {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ]
      return `${months[this.getMonth()]} ${this.getDate()}`
    }
    return originalToLocaleDateString.call(this, 'en-US', options)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CardContent', () => {
  it('renders the card title', () => {
    render(<CardContent card={makeCard()} now={Date.now()} />)
    expect(screen.getByText('Sample card')).toBeInTheDocument()
  })

  it('does not render the metadata row when no due date or labels', () => {
    const { container } = render(
      <CardContent card={makeCard()} now={Date.now()} />
    )
    // Only the title paragraph should be present
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('renders due date badge when dueDate is set', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    render(
      <CardContent card={makeCard({ dueDate: future })} now={Date.now()} />
    )
    // formatDueDate returns something like "May 24"
    expect(screen.getByText(/[A-Z][a-z]+ \d+/)).toBeInTheDocument()
  })

  it('renders overdue badge with red styling', () => {
    const past = '2020-01-01'
    render(<CardContent card={makeCard({ dueDate: past })} now={Date.now()} />)
    const badge = screen.getByText(/Jan 1/)
    expect(badge.className).toMatch(/red/)
  })

  it('renders label dots for each labelId', () => {
    render(
      <CardContent
        card={makeCard({ labelIds: ['red', 'blue'] })}
        now={Date.now()}
      />
    )
    // Each label renders as a small span dot
    const dots = document.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(2)
  })

  it('falls back to gray dot for unknown label id', () => {
    render(
      <CardContent
        card={makeCard({ labelIds: ['unknown-color'] })}
        now={Date.now()}
      />
    )
    const dot = document.querySelector('.rounded-full')
    expect(dot?.className).toContain('bg-gray-400')
  })
})
