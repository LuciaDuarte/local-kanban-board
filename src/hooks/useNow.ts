import { useState } from 'react'
/**
 * Returns a stable timestamp captured once at mount time.
 * Uses the lazy useState initializer.
 */
export function useNow(): number {
  const [now] = useState(() => Date.now())
  return now
}
