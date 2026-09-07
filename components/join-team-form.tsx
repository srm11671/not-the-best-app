"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const inputClass =
  "w-full rounded border bg-transparent px-3 py-2 text-[15px] focus:outline-none focus:border-[--rust]"
const labelClass = "mb-1 block text-xs stamp"

export function JoinTeamForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [code, setCode] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [role, setRole] = useState("")
  const [experience, setExperience] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, displayName, role, experience }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setSubmitting(false)
        return
      }
      router.push(`/teams/${data.team.id}`)
      router.refresh()
    } catch {
      setError("Something went wrong")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-16">
      <Link href="/teams" className="mb-6 inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Racing Teams
      </Link>

      <form onSubmit={handleSubmit} className="paper-card space-y-6 rounded-md p-8">
        <h2 className="font-display text-2xl font-semibold">Join a Racing Team</h2>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          Ask a teammate for the invite code.
        </p>

        {error && (
          <p className="text-sm" style={{ color: "var(--rust)" }}>
            {error}
          </p>
        )}

        <div>
          <label className={labelClass}>Invite code</label>
          <input
            required
            className={inputClass}
            style={{ borderColor: "var(--line)", textTransform: "uppercase" }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ABC12345"
          />
        </div>

        <div>
          <label className={labelClass}>Your display name</label>
          <input
            required
            className={inputClass}
            style={{ borderColor: "var(--line)" }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>

        <div>
          <label className={labelClass}>Your role on the team</label>
          <input
            required
            className={inputClass}
            style={{ borderColor: "var(--line)" }}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Driver, Crew Chief, Tuner, Spotter..."
          />
        </div>

        <div>
          <label className={labelClass}>Experience (optional)</label>
          <input
            className={inputClass}
            style={{ borderColor: "var(--line)" }}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="8 years crewing at the local strip"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="paper-card w-full rounded-md px-4 py-3 text-sm font-semibold hover:-translate-y-0.5 transition-transform disabled:opacity-50"
        >
          {submitting ? "Joining..." : "Join Team"}
        </button>
      </form>
    </div>
  )
}
