"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { VisitComment } from "@/types"
import { format, parseISO } from "date-fns"

interface CommentThreadProps {
  visitId: string
  comments: VisitComment[]
  canComment: boolean
  defaultDisplayName?: string
}

const inputClass =
  "w-full rounded border bg-transparent px-3 py-2 text-[15px] focus:outline-none focus:border-[--rust]"

export function CommentThread({ visitId, comments, canComment, defaultDisplayName }: CommentThreadProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(defaultDisplayName ?? "")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/visits/${visitId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setSubmitting(false)
        return
      }
      setBody("")
      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-6">
      <h4 className="mb-3 font-display text-lg font-semibold">Comments</h4>
      {comments.length === 0 ? (
        <p className="mb-4 text-sm" style={{ color: "var(--ink-soft)" }}>
          No comments yet.
        </p>
      ) : (
        <div className="mb-4 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="paper-card rounded-md p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold">{comment.displayName}</span>
                <span className="text-xs stamp" style={{ color: "var(--ink-soft)" }}>
                  {format(parseISO(comment.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              <p className="mt-1 text-sm">{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      {canComment ? (
        <form onSubmit={handleSubmit} className="paper-card space-y-3 rounded-md p-4">
          {error && (
            <p className="text-sm" style={{ color: "var(--rust)" }}>
              {error}
            </p>
          )}
          <div>
            <input
              required
              className={inputClass}
              style={{ borderColor: "var(--line)" }}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <textarea
              required
              className={inputClass}
              style={{ borderColor: "var(--line)" }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full text-[--paper] px-4 py-2 text-sm hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
            style={{ backgroundColor: "var(--ink)" }}
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          Only team members and fans who've redeemed the fan code can comment.
        </p>
      )}
    </section>
  )
}
