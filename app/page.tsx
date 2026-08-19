import { getVisits } from "@/lib/store"
import { Masthead } from "@/components/masthead"
import { VisitCard } from "@/components/visit-card"
import { NTB_TIERS } from "@/types"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const visits = await getVisits()

  const hiddenGems = visits.filter((v) => v.overallRating === "hidden-gem").length
  const totalRestaurants = new Set(visits.map((v) => v.restaurant)).size

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Masthead />

      <section className="mb-10 grid grid-cols-3 gap-4">
        <div className="paper-card rounded-md p-4 text-center">
          <div className="font-display text-3xl font-bold">{visits.length}</div>
          <div className="text-xs stamp" style={{ color: "var(--ink-soft)" }}>Meals Remembered</div>
        </div>
        <div className="paper-card rounded-md p-4 text-center">
          <div className="font-display text-3xl font-bold">{totalRestaurants}</div>
          <div className="text-xs stamp" style={{ color: "var(--ink-soft)" }}>Restaurants</div>
        </div>
        <div className="paper-card rounded-md p-4 text-center">
          <div className="font-display text-3xl font-bold">{hiddenGems}</div>
          <div className="text-xs stamp" style={{ color: "var(--ink-soft)" }}>Hidden Gems Found</div>
        </div>
      </section>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Your Dining Timeline</h2>
        <Link href="/visit/new" className="text-sm underline decoration-dotted underline-offset-4">
          + Log a new visit
        </Link>
      </div>

      {visits.length === 0 ? (
        <div className="paper-card rounded-md p-10 text-center">
          <p className="font-display text-xl mb-2">No memories yet.</p>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            Log your first visit and start building your personal dining knowledge base.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}

      <footer className="mt-16 border-t pt-6 text-xs" style={{ color: "var(--ink-soft)", borderColor: "var(--line)" }}>
        <p className="italic">
          Google helps people discover restaurants. Yelp shares public opinions. NOT THE BEST® answers
          the question: &ldquo;What did I think the last time I was here?&rdquo;
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {NTB_TIERS.map((t) => (
            <span key={t.id} className="rounded-full border px-2 py-0.5" style={{ borderColor: t.color, color: t.color }}>
              {t.glyph} {t.label}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
