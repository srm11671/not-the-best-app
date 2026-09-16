"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { NTB_TIERS } from "@/types"
import type { FoodItem, NTBRating } from "@/types"

interface RestaurantRatingFormProps {
  teamId: string
  mode: "new" | "rate-existing"
  restaurantId?: string
  existingRestaurantName?: string
  existingRestaurantLocation?: string
}

const inputClass =
  "w-full rounded border bg-transparent px-3 py-2 text-[15px] focus:outline-none focus:border-[--rust]"
const labelClass = "mb-1 block text-xs stamp"

function newFoodItem(): FoodItem {
  return { id: crypto.randomUUID(), name: "", rating: "its-fine", note: "", wouldOrderAgain: false }
}

export function RestaurantRatingForm({
  teamId,
  mode,
  restaurantId,
  existingRestaurantName,
  existingRestaurantLocation,
}: RestaurantRatingFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState("")

  const [restaurant, setRestaurant] = useState(existingRestaurantName ?? "")
  const [location, setLocation] = useState(existingRestaurantLocation ?? "")
  const [rating, setRating] = useState<NTBRating>("its-fine")
  const [summary, setSummary] = useState("")
  const [notes, setNotes] = useState("")
  const [foodItems, setFoodItems] = useState<FoodItem[]>([newFoodItem()])

  function updateFoodItem(id: string, patch: Partial<FoodItem>) {
    setFoodItems((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeFoodItem(id: string) {
    setFoodItems((items) => items.filter((item) => item.id !== id))
  }

  async function handleScanReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setError("")
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const [, base64] = dataUrl.split(",")
      const mediaType = file.type || "image/jpeg"
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not read receipt")
        return
      }
      if (data.restaurant && !restaurant) setRestaurant(data.restaurant)
      if (data.address && !location) setLocation(data.address)
      const scannedItems: FoodItem[] = (data.items ?? []).map((item: { name: string }) => ({
        id: crypto.randomUUID(),
        name: item.name,
        rating: "its-fine" as NTBRating,
        note: "",
        wouldOrderAgain: false,
      }))
      if (scannedItems.length > 0) {
        setFoodItems((items) => {
          const nonEmpty = items.filter((i) => i.name.trim())
          return [...nonEmpty, ...scannedItems]
        })
      }
    } catch {
      setError("Could not read receipt")
    } finally {
      setScanning(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    const cleanFoodItems = foodItems.filter((i) => i.name.trim())
    try {
      const url =
        mode === "new"
          ? `/api/teams/${teamId}/restaurants`
          : `/api/teams/${teamId}/restaurants/${restaurantId}/ratings`
      const payload =
        mode === "new"
          ? { restaurant, location, rating, summary, notes, foodItems: cleanFoodItems }
          : { rating, summary, notes, foodItems: cleanFoodItems }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setSubmitting(false)
        return
      }
      router.push(`/teams/${teamId}`)
      router.refresh()
    } catch {
      setError("Something went wrong")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-16">
      <Link
        href={`/teams/${teamId}`}
        className="mb-6 inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to team
      </Link>

      <form onSubmit={handleSubmit} className="paper-card space-y-6 rounded-md p-8">
        <h2 className="font-display text-2xl font-semibold">
          {mode === "new" ? "Add a Restaurant" : `Rate ${existingRestaurantName}`}
        </h2>

        {error && (
          <p className="text-sm" style={{ color: "var(--rust)" }}>
            {error}
          </p>
        )}

        {mode === "new" && (
          <>
            <div>
              <label className={labelClass}>Restaurant name</label>
              <input
                required
                className={inputClass}
                style={{ borderColor: "var(--line)" }}
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                placeholder="Mo's Not the Best"
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                className={inputClass}
                style={{ borderColor: "var(--line)" }}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Waterfront District"
              />
            </div>
          </>
        )}

        <div>
          <label className={labelClass}>Overall rating</label>
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
          <label className={labelClass}>Summary</label>
          <textarea
            className={inputClass}
            style={{ borderColor: "var(--line)" }}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="How did the whole experience feel?"
            rows={2}
          />
        </div>

        <div>
          <label className={labelClass}>📷 Scan a receipt to fill in dishes</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleScanReceipt}
            disabled={scanning}
            className="text-sm"
          />
          {scanning && (
            <p className="mt-1 text-xs" style={{ color: "var(--ink-soft)" }}>
              Reading receipt...
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Dishes</label>
          <div className="space-y-3">
            {foodItems.map((item) => (
              <div key={item.id} className="paper-card rounded-md p-3 space-y-2">
                <input
                  className={inputClass}
                  style={{ borderColor: "var(--line)" }}
                  value={item.name}
                  onChange={(e) => updateFoodItem(item.id, { name: e.target.value })}
                  placeholder="Dish name"
                />
                <div className="flex flex-wrap gap-1.5">
                  {NTB_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => updateFoodItem(item.id, { rating: tier.id })}
                      className="rounded-full border px-2 py-1 text-xs"
                      style={{
                        borderColor: item.rating === tier.id ? tier.color : "var(--line)",
                        color: item.rating === tier.id ? tier.color : undefined,
                      }}
                    >
                      {tier.glyph}
                    </button>
                  ))}
                </div>
                <input
                  className={inputClass}
                  style={{ borderColor: "var(--line)" }}
                  value={item.note}
                  onChange={(e) => updateFoodItem(item.id, { note: e.target.value })}
                  placeholder="Notes about this dish"
                />
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.wouldOrderAgain}
                      onChange={(e) => updateFoodItem(item.id, { wouldOrderAgain: e.target.checked })}
                    />
                    Would order again
                  </label>
                  <button
                    type="button"
                    onClick={() => removeFoodItem(item.id)}
                    className="text-xs underline decoration-dotted underline-offset-4"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFoodItems((items) => [...items, newFoodItem()])}
            className="mt-3 text-sm underline decoration-dotted underline-offset-4"
          >
            + Add dish
          </button>
        </div>

        <div>
          <label className={labelClass}>Private notes (optional)</label>
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
          className="paper-card w-full rounded-md px-4 py-3 text-sm font-semibold hover:-translate-y-0.5 transition-transform disabled:opacity-50"
        >
          {submitting ? "Saving..." : mode === "new" ? "Add Restaurant" : "Save My Rating"}
        </button>
      </form>
    </div>
  )
}
