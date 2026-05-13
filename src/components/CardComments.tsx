import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Comment } from '../store/types'
import { formatHistoryTimestamp } from '../utils/date'

type Props = {
  cardId: string
  comments: Comment[]
  addComment: (cardId: string, text: string) => void
  deleteComment: (cardId: string, commentId: string) => void
  editComment: (cardId: string, commentId: string, text: string) => void
}

function FormattedDate({ iso }: { iso: string }) {
  const formatted = useMemo(() => formatHistoryTimestamp(iso), [iso])
  return <>{formatted}</>
}

export function CardComments({
  cardId,
  comments,
  addComment,
  deleteComment,
  editComment,
}: Props) {
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const prevCommentCountRef = useRef(comments.length)

  useLayoutEffect(() => {
    if (comments.length > prevCommentCountRef.current) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevCommentCountRef.current = comments.length
  }, [comments.length])

  function handleAddComment() {
    const trimmed = commentText.trim()
    if (!trimmed) return
    addComment(cardId, trimmed)
    setCommentText('')
  }

  function handleStartEditComment(commentId: string, currentText: string) {
    setEditingCommentId(commentId)
    setEditingCommentText(currentText)
  }

  function handleSaveEditComment() {
    if (!editingCommentId) return
    const trimmed = editingCommentText.trim()
    if (!trimmed) return
    editComment(cardId, editingCommentId, trimmed)
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  function handleCancelEditComment() {
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        Comments
      </p>
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              {editingCommentId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingCommentText}
                    onChange={(e) => setEditingCommentText(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 resize-none transition-colors"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEditComment}
                      className="text-xs text-white bg-blue-500 hover:bg-blue-600 px-2.5 py-1 rounded-md transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditComment}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                      {comment.text}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <FormattedDate iso={comment.createdAt} />
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        handleStartEditComment(comment.id, comment.text)
                      }
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      aria-label="Edit comment"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteComment(cardId, comment.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Delete comment"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 resize-none transition-colors"
          aria-label="New comment"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleAddComment()
            }
          }}
        />
        <button
          onClick={handleAddComment}
          disabled={!commentText.trim()}
          className="self-end px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}
