"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Masthead } from "@/components/masthead"
import { NTB_TIERS, NTBRating, FoodItem, ConsideredItem } from "@/types"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

function emptyFoodItem(): FoodItem {
  return { id: crypto.randomUUID(), name: "", rating: "its-fine", note: "", wouldOrderAgain: false }
}

function emptyConsidered(): ConsideredItem {
  return { id: crypto.randomUUID(), name: "", reason: "" }
}

export default function NewVisitPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const [restaurant, setRestaurant] = useState("")
  const [location, setLocation] = useState("")
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
  const [pricePerPerson, setPricePerPerson] = useState("")
  const [waitTimeMinutes, setWaitTimeMinutes] = useState("")
  const [atmosphere, setAtmosphere] = useState(7)
  const [cleanliness, setCleanliness] = useState(7)
  const [overallValue, setOverallValue] = useState(7)
  const [privateNotes, setPrivateNotes] = useState("")
  const [photos, setPhotos] = useState("0")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      restaurant,
      location,
      date,
      occasion,
      companions: companions.split(",").map((c) => c.trim()).filter(Boolean),
      overallRating,
      summary,
      serviceNotes: serviceNotes.split("\n").map((s) => s.trim()).filter(Boolean),
      foodItems: foodItems.filter((f) => f.name.trim()),
      itemsConsidered: itemsConsidered.filter((c) => c.name.trim()),
      itemsPassedOn: [],
      wantToTryNextTime: wantToTryNextTime.split("\n").map((s) => s.trim()).filter(Boolean),
      totalSpent: Number(totalSpent) || 0,
      pricePerPerson: Number(pricePerPerson) || 0,
      waitTimeMinutes: Number(waitTimeMinutes) || 0,
      atmosphere,
      cleanliness,
      overallValue,
      privateNotes,
      photos: Number(photos) || 0,
    }

    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const visit = await res.json()
    setSubmitting(false)
    router.push(`/visit/${visit.id}`)
    router.refresh()
  }

  const inputClass =
    "w-full rounded border bg-transparent px-3 py-2 text-[15px] focus:outline-none focus:border-[--rust]"
  const labelClass = "mb-1 block text-xs stamp font-semibold"

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Masthead />
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm hover:text-[--rust]">
        <ArrowLeft className="h-4 w-4" /> Back to timeline
      </Link>

      <h2 className="font-display text-3xl font-bold mb-6">Log a Dining Memory</h2>

      <form onSubmit={handleSubmit} className="paper-card space-y-8 rounded-md p-8">
        <section className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Restaurant</label>
            <input required className={inputClass} style={{ borderColor: "var(--line)" }} value={restaurant} onChange={(e) => setRestaurant(e.target.value)} placeholder="Chuck's Seafood" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Location</label>
            <input className={inputClass} style={{ borderColor: "var(--line)" }} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Waterfront District" />
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
          <label className={labelClass}>Overall NTB Rating™</label>
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
          <label className={labelClass}>Summary</label>
          <textarea className={inputClass} style={{ borderColor: "var(--line)" }} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="How did the whole experience feel?" />
        </section>

        <section>
          <label className={labelClass}>Service Notes (one per line)</label>
          <textarea className={inputClass} style={{ borderColor: "var(--line)" }} rows={3} value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} placeholder="Repeatedly needed to get the bartender's attention." />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <label className={labelClass}>Food Review</label>
            <button type="button" onClick={() => setFoodItems([...foodItems, emptyFoodItem()])} className="inline-flex items-center gap-1 text-xs stamp hover:text-[--rust]">
              <Plus className="h-3.5 w-3.5" /> Add dish
            </button>
          </div>
          <div className="space-y-4">
            {foodItems.map((item, idx) => (
              <div key={item.id} className="rounded border p-4" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className={inputClass}
                    style={{ borderColor: "var(--line)" }}
                    placeholder="Dish name"
                    value={item.name}
                    onChange={(e) => {
                      const next = [...foodItems]
                      next[idx] = { ...item, name: e.target.value }
                      setFoodItems(next)
                    }}
                  />
                  <button type="button" onClick={() => setFoodItems(foodItems.filter((_, i) => i !== idx))} className="shrink-0 text-[--rust]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {NTB_TIERS.map((tier) => (
                    <button
                      type="button"
                      key={tier.id}
                      onClick={() => {
                        const next = [...foodItems]
                        next[idx] = { ...item, rating: tier.id }
                        setFoodItems(next)
                      }}
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
                  onChange={(e) => {
                    const next = [...foodItems]
                    next[idx] = { ...item, note: e.target.value }
                    setFoodItems(next)
                  }}
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.wouldOrderAgain}
                    onChange={(e) => {
                      const next = [...foodItems]
                      next[idx] = { ...item, wouldOrderAgain: e.target.checked }
                      setFoodItems(next)
                    }}
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
            <input type="number" className={inputClass} style={{ borderColor: "var(--line)" }} value={pricePerPerson} onChange={(e) => setPricePerPerson(e.target.value)} />
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
          <label className={labelClass}>Private Notes</label>
          <textarea className={inputClass} style={{ borderColor: "var(--line)" }} rows={2} value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} placeholder="Only you will see this." />
        </section>

        <button
          type="submit"
          disabled={submitting || !restaurant.trim()}
          className="w-full rounded-full bg-[--ink] py-3 font-semibold text-[--paper] transition-colors hover:bg-[--rust] disabled:opacity-50"
        >
          {submitting ? "Saving memory…" : "Save this Memory"}
        </button>
      </form>
    </div>
  )
}
