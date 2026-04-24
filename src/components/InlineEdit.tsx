import { useState, useRef, useEffect } from 'react'

type Props = {
  value: string
  onCommit: (value: string) => void
  className?: string
  placeholder?: string
  maxLength?: number
}

/**
 * An inline text input that shows as plain text until clicked.
 * Commits on Enter or blur, cancels on Escape.
 */
export function InlineEdit({
  value,
  onCommit,
  className = '',
  placeholder,
  maxLength,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.select()
    }
  }, [editing])

  function handleBlur() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onCommit(trimmed)
    else setDraft(value)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') inputRef.current?.blur()
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`bg-transparent outline-none border-b border-blue-500 w-full ${className}`}
      />
    )
  }

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
      className={`cursor-text text-left bg-transparent border-none p-0 ${className}`}
    >
      {value || <span className="opacity-40">{placeholder}</span>}
    </button>
  )
}
