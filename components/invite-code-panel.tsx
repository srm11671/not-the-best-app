"use client"

import { useState } from "react"
import { RefreshCw, Copy, Check } from "lucide-react"

interface InviteCodePanelProps {
  teamId: string
  inviteCode: string
}

export function InviteCodePanel({ teamId, inviteCode }: InviteCodePanelProps) {
  const [code, setCode] = useState(inviteCode)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/regenerate-invite`, { method: "POST" })
      const data = await res.json()
      if (res.ok) setCode(data.inviteCode)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="paper-card rounded-md p-4">
      <div className="text-xs stamp mb-2" style={{ color: "var(--ink-soft)" }}>
        Invite code (admins only)
      </div>
      <div className="flex items-center gap-2">
        <code className="rounded border px-3 py-2 text-lg font-semibold tracking-widest" style={{ borderColor: "var(--line)" }}>
          {code}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded border px-2 py-2 hover:text-[--rust] transition-colors"
          style={{ borderColor: "var(--line)" }}
          aria-label="Copy invite code"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="rounded border px-2 py-2 hover:text-[--rust] transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--line)" }}
          aria-label="Regenerate invite code"
        >
          <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  )
}
