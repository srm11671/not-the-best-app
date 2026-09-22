"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { NTB_TIERS, NTBRating, FoodItem, ConsideredItem } from "@/types"

interface RestaurantRatingFormProps {
  teamId: string
  mode: "new" | "rate-existing"
  restaurantId?: string
  existingRestaurantName?: string
  existingRestaurantLocation?: string
}

function emptyFoodItem(): FoodItem {
  return { id: crypto.randomUUID(), name: "", rating: "its-fine", note: "", wouldOrderAgain: false }
}

function emptyConsidered(): ConsideredItem {
  return { id: crypto.randomUUID(), name: "", reason: "" }
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
  const [error, setError] = useState("")

  const [restaurant, setRestaurant] = useState(existingRestaurantName ?? "")
  const [location, setLocation] = useState(existingRestaurantLocation ?? "")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [occasion, setOccasion] = useState("")
  const [companions, setCompanions] = useState("")
  const [overallRating, setOverallRating] = useState<NTBRating>("its-fine")
  const [summary, setSummary] = useState("")
  const [serviceNotes, setServiceNotes] = useState("")
  const [foodItems, setFoodItems] = useState<FoodItem[]>([emptyFoodItem()])
  const [itemsConsidered, setItemsConsidered] = useState<ConsideredItem[]>([])
  const [wantToTryNextTime, setWantToTryNextTime] = useState("")
  const [totalSpent, setTotalSpent] = useState("")
  const [waitTimeMinutes, setWaitTimeMinutes] = useState("")
  const [atmosphere, setAtmosphere] = useState(7)
  const [cleanliness, setCleanliness] = useState(7)
  const [overallValue, setOverallValue] = useState(7)
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState("0")
  const [criticName, setCriticName] = useState("")
  const [criticRating, setCriticRating] = useState("")
  const [criticReviewUrl, setCriticReviewUrl] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState("")

  const companionCount = companions.split(",").map((c) => c.trim()).filter(Boolean).length
  const totalDiners = companionCount + 1
  const parsedTotal = Number(totalSpent)
  const computedPricePerPerson =
    totalSpent.trim() && !Number.isNaN(parsedTotal) && parsedTotal > 0
      ? Math.max(0, parsedTotal / totalDiners)
      : 0

  function updateFoodItem(id: string, patch: Partial<FoodItem>) {
    setFoodItems((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeFoodItem(id: string) {
    setFoodItems((items) => items.filter((item) => item.id !== id))
  }

  async function handleReceiptScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    setScanning(true)
    setScanError("")

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(",")[1])
        reader.onerror = () => reject(new Error("Could not read the photo"))
        reader.readAsDataURL(file)
      })

      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType: file.type }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not read receipt")

      if (data.restaurant && !restaurant.trim()) setRestaurant(data.restaurant)
      if (data.address && !location.trim()) setLocation(data.address)
      if (data.date) setDate(data.date)
      if (data.total != null) setTotalSpent(String(data.total))

      if (Array.isArray(data.items) && data.items.length > 0) {
        const scannedItems: FoodItem[] = data.items.map((item: { name: string; price: number }) => ({
          id: crypto.randomUUID(),
          name: item.name,
          rating: "its-fine" as NTBRating,
          note: item.price != null ? `$${item.price.toFixed(2)}` : "",
          wouldOrderAgain: false,
        }))
        setFoodItems((prev) => {
          const withoutBlank = prev.filter((i) => i.name.trim() !== "")
          return [...withoutBlank, ...scannedItems]
        })
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Could not read receipt")
    } finally {
      setScanning(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    const cleanFoodItems = foodItems.filter((f) => f.name.trim())
    const payload = {
      restaurant,
      location,
      rating: overallRating,
      summary,
      notes,
      foodItems: cleanFoodItems,
      date,
      occasion,
      companions: companions.split(",").map((c) => c.trim()).filter(Boolean),
      serviceNotes: serviceNotes.split("\n").map((s) => s.trim()).filter(Boolean),
      itemsConsidered: itemsConsidered.filter((c) => c.name.trim()),
      wantToTryNextTime: wantToTryNextTime.split("\n").map((s) => s.trim()).filter(Boolean),
      totalSpent: Number(totalSpent) || 0,
      pricePerPerson: computedPricePerPerson,
      waitTimeMinutes: Number(waitTimeMinutes) || 0,
      atmosphere,
      cleanliness,
      overallValue,
      photos: Number(photos) || 0,
      criticName: criticName.trim() || undefined,
      criticRating: criticRating.trim() ? Math.min(10, Math.max(0, Number(criticRating))) : undefined,
      criticReviewUrl: criticReviewUrl.trim() || undefined,
    }

    try {
      const url =
        mode === "new"
          ? `/api/teams/${teamId}/restaurants`
          : `/api/teams/${teamId}/restaurants/${restaurantId}/ratings`
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

  const inputClass =
    "w-full rounded border bg-transparent px-3 py-2 text-[15px] focus:outline-none focus:border-[--rust]"
  const labelClass = "mb-1 block text-xs stamp font-semibold"

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/teams/${teamId}`} className="mb-6 inline-flex items-center gap-1 text-sm hover:text-[--rust]">
        <ArrowLeft className="h-4 w-4" /> Back to team
      </Link>

      <h2 className="font-display text-3xl font-bold mb-6">
        {mode === "new" ? "Add a Restaurant" : `Rate ${existingRestaurantName}`}
      </h2>

      {error && (
        <div className="paper-card mb-6 rounded-md p-4 text-sm" style={{ color: "var(--rust)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="paper-card space-y-8 rounded-md p-8">
        <section className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Restaurant</label>
            <input
              required
              disabled={mode !== "new"}
              className={inputClass}
              style={{ borderColor: "var(--line)" }}
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              placeholder="Mo's Not the Best"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Location</label>
            <input
              disabled={mode !== "new"}
              className={inputClass}
              style={{ borderColor: "var(--line)" }}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Waterfront District"
            />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" className={inputClass} style={{ borderColor: "var(--line)" }} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Occasion</label>
            <input className={inputClass} style={{ borderColor: "var(--line)" }} value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Casual dinner with friends" />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Companions (comma separated)</label>
            <input className={inputClass} style={{ borderColor: "var(--line)" }} value={companions} onChange={(e) => setCompanions(e.target.value)} placeholder="Jamie, Priya" />
          </div>
        </section>

        <section>
          <label className={labelClass}>Overall NTB Rating¢</label>
          <div className="flex flex-wrap gap-2">
            {NTB_TIERS.map((tier) => (
              <button
                type="button"
                key={tier.id}
                onClick={() => setOverallRating(tier.id)}
                className="rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
                style={{
                  borderColor: tier.color,
                  color: overallRating === tier.id ? "var(--paper)" : tier.color,
                  backgroundColor: overallRating === tier.id ? tier.color : "transparent",
                }}
              >
                {tier.glyph} {tier.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className={labelClass}>Local Critic (optional)</label>
          <p className="text-xs mb-2" style={{ color: "var(--ink-soft)" }}>
            If a food critic you follow has reviewed this spot, enter their name and score so you can compare it to your own rating.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Critic's name</label>
              <input type="text" className={inputClass} style={{ borderColor: "var(--line)" }} value={criticName} onChange={(e) => setCriticName(e.target.value)} placeholder="e.g. Baldy Eats" />
            </div>
            <div>
              <label className={labelClass}>Their score (0–10)</label>
              <input type="number" min={0} max={10} step={0.1} className={inputClass} style={{ borderColor: "var(--line)" }} value={criticRating} onChange={(e) => setCriticRating(e.target.value)} placeholder="9.8" />
            </div>
            <div>
              <label className={labelClass}>Link to their review</label>
              <input type="url" className={inputClass} style={{ borderColor: "var(--line)" }} value={criticReviewUrl} onChange={(e) => setCriticReviewUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." />
            </div>
          </div>
        </section>

        <section>
          <label className={labelClass}>Summary</label>
          <textarea className={inputClass} style={{ borderColor: "var(--line)" }} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="How did the whole experience feel?" />
        </section>

        <section>
          <label className={labelClass}>Service Notes (one per line)</label>
          <textarea className={inputClass} style={{ borderColor: "var(--line)" }} rows={3} value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} placeholder="Repeatedly needed to get the bartender's attention." />
        </section>

        <section>
          <div className="rounded border-2 border-dashed p-4 text-center" style={{ borderColor: "var(--line)" }}>
            <label className="inline-flex flex-col items-center gap-2 cursor-pointer">
              <span className="text-sm font-semibold">
                {scanning ? "Reading your receipt…" : "🧾 Scan a receipt to fill in dishes & total"}
              </span>
              <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
                We'll pull item names and prices from the photo. You still rate everything yourself.
              </span>
              <input type="file" accept="image/*" onChange={handleReceiptScan} disabled={scanning} className="hidden" />
              <span className="mt-1 rounded-full px-4 py-1.5 text-xs font-semibold text-[--paper]" style={{ backgroundColor: scanning ? "var(--ink-soft)" : "var(--ink)" }}>
                {scanning ? "Scanning…" : "Choose photo"}
              </span>
            </label>
            {scanError && (
              <p className="mt-2 text-xs" style={{ color: "var(--rust)" }}>
                {scanError}
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <label className={labelClass}>Food Review</label>
            <button type="button" onClick={() => setFoodItems([...foodItems, emptyFoodItem()])} className="inline-flex items-center gap-1 text-xs stamp hover:text-[--rust]">
              <Plus className="h-3.5 w-3.5" /> Add dish
            </button>
          </div>
          <div className="space-y-4">
            {foodItems.map((item) => (
              <div key={item.id} className="rounded border p-4" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className={inputClass}
                    style={{ borderColor: "var(--line)" }}
                    placeholder="Dish name"
                    value={item.name}
                    onChange={(e) => updateFoodItem(item.id, { name: e.target.value })}
                  />
                  <button type="button" onClick={() => removeFoodItem(item.id)} className="shrink-0 text-[--rust]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {NTB_TIERS.map((tier) => (
                    <button
                      type="button"
                      key={tier.id}
                      onClick={() => updateFoodItem(item.id, { rating: tier.id })}
                      className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        borderColor: tier.color,
                        color: item.rating === tier.id ? "var(--paper)" : tier.color,
                        backgroundColor: item.rating === tier.id ? tier.color : "transparent",
                      }}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className={inputClass}
                  style={{ borderColor: "var(--line)" }}
                  rows={2}
                  placeholder="Notes about this dish"
                  value={item.note}
                  onChange={(e) => updateFoodItem(item.id, { note: e.target.value })}
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.wouldOrderAgain}
                    onChange={(e) => updateFoodItem(item.id, { wouldOrderAgain: e.target.checked })}
                  />
                  Would order again
                </label>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <label className={labelClass}>Items Considered (not ordered)</label>
            <button type="button" onClick={() => setItemsConsidered([...itemsConsidered, emptyConsidered()])} className="inline-flex items-center gap-1 text-xs stamp hover:text-[--rust]">
              <Plus className="h-3.5 w-3.5" /> Add item
            </button>
          </div>
          <div className="space-y-2">
            {itemsConsidered.map((item, idx) => (
              <div key={item.id} className="flex gap-2">
                <input
                  className={inputClass}
                  style={{ borderColor: "var(--line)" }}
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => {
                    const next = [...itemsConsidered]
                    next[idx] = { ...item, name: e.target.value }
                    setItemsConsidered(next)
                  }}
                />
                <input
                  className={inputClass}
                  style={{ borderColor: "var(--line)" }}
                  placeholder="Why not ordered"
                  value={item.reason}
                  onChange={(e) => {
                    const next = [...itemsConsidered]
                    next[idx] = { ...item, reason: e.target.value }
                    setItemsConsidered(next)
                  }}
                />
                <button type="button" onClick={() => setItemsConsidered(itemsConsidered.filter((_, i) => i !== idx))} className="shrink-0 text-[--rust]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <label className={labelClass}>Want to Try Next Time (one per line)</label>
          <textarea className={inputClass} style={{ borderColor: "var(--line)" }} rows={2} value={wantToTryNextTime} onChange={(e) => setWantToTryNextTime(e.target.value)} />
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Total Spent ($)</label>
            <input type="number" className={inputClass} style={{ borderColor: "var(--line)" }} value={totalSpent} onChange={(e) => setTotalSpent(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Per Person ($)</label>
            <div className={inputClass} style={{ borderColor: "var(--line)" }}>
              {computedPricePerPerson.toFixed(2)}
            </div>
            <p className="mt-1 text-[11px]" style={{ color: "var(--ink-soft)" }}>
              Auto-calculated: Total Spent ÷ {totalDiners} {totalDiners === 1 ? "person" : "people"}
            </p>
          </div>
          <div>
            <label className={labelClass}>Wait (min)</label>
            <input type="number" className={inputClass} style={{ borderColor: "var(--line)" }} value={waitTimeMinutes} onChange={(e) => setWaitTimeMinutes(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Photos taken</label>
            <input type="number" className={inputClass} style={{ borderColor: "var(--line)" }} value={photos} onChange={(e) => setPhotos(e.target.value)} />
          </div>
        </section>

        <section className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Atmosphere: {atmosphere}/10</label>
            <input type="range" min={0} max={10} value={atmosphere} onChange={(e) => setAtmosphere(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className={labelClass}>Cleanliness: {cleanliness}/10</label>
            <input type="range" min={0} max={10} value={cleanliness} onChange={(e) => setCleanliness(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className={labelClass}>Overall Value: {overallValue}/10</label>
            <input type="range" min={0} max={10} value={overallValue} onChange={(e) => setOverallValue(Number(e.target.value))} className="w-full" />
          </div>
        </section>

        <section className="rounded-md border-l-4 p-4" style={{ borderColor: "var(--gold)", backgroundColor: "rgba(192,138,46,0.08)" }}>
          <label className={labelClass}>Notes</label>
          <textarea className={inputClass} style={{ borderColor: "var(--line)" }} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else worth remembering." />
        </section>

        <button
          type="submit"
          disabled={submitting || !restaurant.trim()}
          className="w-full rounded-full bg-[--ink] py-3 font-semibold text-[--paper] transition-colors hover:bg-[--rust] disabled:opacity-50"
        >
          {submitting ? "Saving…" : mode === "new" ? "Add Restaurant" : "Save My Rating"}
        </button>
      </form>
    </div>
  )
}
