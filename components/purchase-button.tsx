"use client"

import { useState } from "react"

export function PurchaseButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handlePurchase() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/checkout", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Something went wrong")
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full rounded-full text-[--paper] px-4 py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "var(--ink)" }}
      >
        {loading ? "Redirecting to checkout…" : "Get lifetime access"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-center" style={{ color: "var(--rust)" }}>
          {error}
        </p>
      )}
    </div>
  )
}
