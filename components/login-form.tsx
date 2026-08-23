"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    setErrorMessage("")

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setStatus("error")
      setErrorMessage(error.message)
      return
    }
    setStatus("sent")
  }

  if (status === "sent") {
    return (
      <div className="paper-card rounded-md p-6 text-center">
        <p className="font-display text-lg mb-1">Check your email</p>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          We sent a sign-in link to <span className="font-semibold">{email}</span>.
          Tap it on this device to continue.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="paper-card rounded-md p-6">
      <label htmlFor="email" className="block text-sm mb-2" style={{ color: "var(--ink-soft)" }}>
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border px-3 py-2 mb-4 bg-transparent"
        style={{ borderColor: "var(--line)" }}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full text-[--paper] px-4 py-2 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "var(--ink)" }}
      >
        {status === "sending" ? "Sending link…" : "Send me a sign-in link"}
      </button>
      {status === "error" && (
        <p className="mt-3 text-sm" style={{ color: "var(--rust)" }}>
          {errorMessage}
        </p>
      )}
    </form>
  )
}
