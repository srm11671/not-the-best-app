import { getVisit } from "@/lib/store"
import { Masthead } from "@/components/masthead"
import { NTBBadge } from "@/components/ntb-badge"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, Users, Clock, DollarSign, Pencil } from "lucide-react"
import { format, parseISO } from "date-fns"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function VisitDetailPage({ params }: { params: { id: string } }) {
  const visit = await getVisit(params.id)
  if (!visit) notFound()

  const stats: { label: string; value: number }[] = [
    { label: "Atmosphere", value: visit.atmosphere },
    { label: "Cleanliness", value: visit.cleanliness },
    { label: "Overall Value", value: visit.overallValue },
  ]

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Masthead />

      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1 text-sm hover:text-[--rust]">
          <ArrowLeft className="h-4 w-4" /> Back to timeline
        </Link>
        <Link
          href={`/visit/${visit.id}/edit`}
          className="inline-flex items-center gap-1 text-sm rounded-full border px-3 py-1.5 hover:text-[--rust] hover:border-[--rust] transition-colors"
          style={{ borderColor: "var(--line)" }}
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Link>
      </div>

      <article className="paper-card rounded-md p-8 ruled">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-bold">{visit.restaurant}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "var(--ink-soft)" }}>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {visit.location}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(parseISO(visit.date), "MMMM d, yyyy")}</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {visit.companions.join(", ") || "Solo"}</span>
            </div>
            <p className="mt-1 text-sm italic" style={{ color: "var(--ink-soft)" }}>{visit.occasion}</p>
          </div>
          <NTBBadge rating={visit.overallRating} size="lg" showTagline />
        </div>

        <p className="mt-6 text-lg leading-relaxed font-body">{visit.summary}</p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div className="rounded border p-3" style={{ borderColor: "var(--line)" }}>
            <div className="font-display text-xl font-bold inline-flex items-center gap-1 justify-center"><DollarSign className="h-4 w-4" />{visit.totalSpent}</div>
            <div className="text-[11px] stamp" style={{ color: "var(--ink-soft)" }}>Total Spent</div>
          </div>
          <div className="rounded border p-3" style={{ borderColor: "var(--line)" }}>
            <div className="font-display text-xl font-bold">${visit.pricePerPerson}</div>
            <div className="text-[11px] stamp" style={{ color: "var(--ink-soft)" }}>Per Person</div>
          </div>
          <div className="rounded border p-3" style={{ borderColor: "var(--line)" }}>
            <div className="font-display text-xl font-bold inline-flex items-center gap-1 justify-center"><Clock className="h-4 w-4" />{visit.waitTimeMinutes}m</div>
            <div className="text-[11px] stamp" style={{ color: "var(--ink-soft)" }}>Wait Time</div>
          </div>
          {stats.map((s) => (
            <div key={s.label} className="rounded border p-3" style={{ borderColor: "var(--line)" }}>
              <div className="font-display text-xl font-bold">{s.value}/10</div>
              <div className="text-[11px] stamp" style={{ color: "var(--ink-soft)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {visit.serviceNotes.length > 0 && (
          <section className="mt-8">
            <h3 className="font-display text-xl font-semibold mb-3">Service Experience</h3>
            <ul className="space-y-1.5">
              {visit.serviceNotes.map((note, i) => (
                <li key={i} className="text-[15px] before:content-['—_'] before:opacity-50">{note}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h3 className="font-display text-xl font-semibold mb-3">Food Review</h3>
          <div className="space-y-4">
            {visit.foodItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-none" style={{ borderColor: "var(--line)" }}>
                <div>
                  <div className="font-semibold font-display text-lg">
                    {item.name}
                    {item.wouldOrderAgain && <span className="ml-2 text-xs font-normal italic" style={{ color: "var(--ink-soft)" }}>would order again</span>}
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>{item.note}</p>
                </div>
                <NTBBadge rating={item.rating} size="sm" />
              </div>
            ))}
          </div>
        </section>

        {visit.itemsConsidered.length > 0 && (
          <section className="mt-8">
            <h3 className="font-display text-xl font-semibold mb-3">Items Considered</h3>
            {visit.itemsConsidered.map((item) => (
              <div key={item.id} className="mb-2">
                <span className="font-semibold">{item.name}</span>{" "}
                <span className="text-sm" style={{ color: "var(--ink-soft)" }}>— {item.reason}</span>
              </div>
            ))}
          </section>
        )}

        {visit.wantToTryNextTime.length > 0 && (
          <section className="mt-8">
            <h3 className="font-display text-xl font-semibold mb-3">Want to Try Next Time</h3>
            <ul className="list-disc list-inside space-y-1 text-[15px]">
              {visit.wantToTryNextTime.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {visit.privateNotes && (
          <section className="mt-8 rounded-md border-l-4 p-4" style={{ borderColor: "var(--gold)", backgroundColor: "rgba(192,138,46,0.08)" }}>
            <h3 className="font-display text-base font-semibold mb-1 stamp">Private Notes</h3>
            <p className="text-sm italic">{visit.privateNotes}</p>
          </section>
        )}

        <p className="mt-10 text-xs italic text-center" style={{ color: "var(--ink-soft)" }}>
          Months later you immediately know what to order again, what to skip, what service issues occurred, and why.
        </p>
      </article>
    </div>
  )
}
