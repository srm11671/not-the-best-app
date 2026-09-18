"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogoMark } from "@/components/logo-mark"

export const dynamic = "force-dynamic"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("working")
    setErrorMessage("")

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus("error")
      setErrorMessage(error.message)
      return
    }

    setStatus("done")
    setTimeout(() => router.push("/"), 1200)
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <div className="flex flex-col items-center gap-3 mb-8">
        <LogoMark size={48} />
        <h1 className="font-display text-2xl font-black tracking-tight">Set your password</h1>
        <p className="text-sm text-center" style={{ color: "var(--ink-soft)" }}>
          Choose a password you'll use to log in from now on.
        </p>
      </div>

      {status === "done" ? (
        <div className="paper-card rounded-md p-6 text-center">
          <p className="font-display text-lg">Password set!</p>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Taking you home...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="paper-card rounded-md p-6">
          <label htmlFor="password" className="block text-sm mb-2" style={{ color: "var(--ink-soft)" }}>
            New password
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
          <button
            type="submit"
            disabled={status === "working"}
            className="w-full rounded-full text-[--paper] px-4 py-2 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "var(--ink)" }}
          >
            {status === "working" ? "Saving..." : "Save password"}
          </button>
          {errorMessage && (
            <p className="mt-3 text-sm" style={{ color: "var(--rust)" }}>
              {errorMessage}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
