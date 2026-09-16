"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { NTB_TIERS } from "@/types"
import type { NTBRating, FanPrivateRating } from "@/types"

interface FanRatingFormProps {
  teamId: string
}

const inputClass =
  "w-full rounded border bg-transparent px-3 py-2 text-[15px] focus:outline-none focus:border-[--rust]"
const labelClass = "mb-1 block text-xs stamp"

export function FanRatingForm({ teamId }: FanRatingFormProps) {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState("")
  const [location, setLocation] = useState("")
  const [rating, setRating] = useState<NTBRating>("its-fine")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/teams/${teamId}/fan-ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant, location, rating, notes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setSubmitting(false)
        return
      }
      setRestaurant("")
      setLocation("")
      setNotes("")
      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="paper-card space-y-4 rounded-md p-6">
      <h3 className="font-display text-lg font-semibold">Log a Private Rating</h3>
      <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
        Only you can see this -- it&apos;s never shared with the team.
      </p>
      {error && (
        <p className="text-sm" style={{ color: "var(--rust)" }}>
          {error}
        </p>
      )}
      <div>
        <label className={labelClass}>Restaurant</label>
        <input
          required
          className={inputClass}
          style={{ borderColor: "var(--line)" }}
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Location</label>
        <input
          className={inputClass}
          style={{ borderColor: "var(--line)" }}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Your rating</label>
        <div className="flex flex-wrap gap-2">
          {NTB_TIERS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setRating(tier.id)}
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{
                borderColor: rating === tier.id ? tier.color : "var(--line)",
                color: rating === tier.id ? tier.color : undefined,
              }}
            >
              {tier.glyph} {tier.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={inputClass}
          style={{ borderColor: "var(--line)" }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full text-[--paper] px-4 py-2 text-sm hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
        style={{ backgroundColor: "var(--ink)" }}
      >
        {submitting ? "Saving..." : "Save Private Rating"}
      </button>
    </form>
  )
}

export function FanRatingsList({ ratings }: { ratings: FanPrivateRating[] }) {
  if (ratings.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
        No private ratings logged yet.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {ratings.map((r) => (
        <div key={r.id} className="paper-card rounded-md p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">{r.restaurant}</span>
            <span className="text-xs stamp" style={{ color: "var(--ink-soft)" }}>{r.rating}</span>
          </div>
          {r.location && (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{r.location}</p>
          )}
          {r.notes && <p className="mt-1 text-sm">{r.notes}</p>}
        </div>
      ))}
    </div>
  )
}
