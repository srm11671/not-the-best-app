"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Mode = "sign-in" | "sign-up" | "forgot"

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "working" | "sent" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("working")
    setErrorMessage("")

    const supabase = createClient()

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
      })
      if (error) {
        setStatus("error")
        setErrorMessage(error.message)
        return
      }
      setStatus("sent")
      return
    }

    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
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
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus("error")
      setErrorMessage(error.message)
      return
    }
    window.location.href = next
  }

  if (status === "sent" && mode === "forgot") {
    return (
      <div className="paper-card rounded-md p-6 text-center">
        <p className="font-display text-lg mb-1">Check your email</p>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          We sent a link to <span className="font-semibold">{email}</span> so you can set your password.
        </p>
      </div>
    )
  }

  if (status === "sent" && mode === "sign-up") {
    return (
      <div className="paper-card rounded-md p-6 text-center">
        <p className="font-display text-lg mb-1">Confirm your email</p>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          We sent a confirmation link to <span className="font-semibold">{email}</span>. Tap it, then come
          back and sign in with your email and password.
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

      {mode !== "forgot" && (
        <>
          <label htmlFor="password" className="block text-sm mb-2" style={{ color: "var(--ink-soft)" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-md border px-3 py-2 mb-4 bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </>
      )}

      <button
        type="submit"
        disabled={status === "working"}
        className="w-full rounded-full text-[--paper] px-4 py-2 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "var(--ink)" }}
      >
        {status === "working"
          ? "Working..."
          : mode === "sign-in"
            ? "Log in"
            : mode === "sign-up"
              ? "Create account"
              : "Send me a reset link"}
      </button>

      {errorMessage && (
        <p className="mt-3 text-sm" style={{ color: "var(--rust)" }}>
          {errorMessage}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-sm" style={{ color: "var(--ink-soft)" }}>
        {mode === "sign-in" && (
          <>
            <button type="button" className="underline" onClick={() => { setMode("sign-up"); setStatus("idle"); setErrorMessage("") }}>
              Create an account
            </button>
            <button type="button" className="underline" onClick={() => { setMode("forgot"); setStatus("idle"); setErrorMessage("") }}>
              Forgot password?
            </button>
          </>
        )}
        {mode !== "sign-in" && (
          <button type="button" className="underline" onClick={() => { setMode("sign-in"); setStatus("idle"); setErrorMessage("") }}>
            Back to log in
          </button>
        )}
      </div>
    </form>
  )
}
