import { Masthead } from "@/components/masthead"
import { NTB_TIERS } from "@/types"

export const dynamic = "force-dynamic"

export default function RatingPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Masthead />

      <h2 className="font-display text-3xl font-bold mb-2">The NTB Rating™</h2>
      <p className="mb-8 italic text-lg" style={{ color: "var(--ink-soft)" }}>
        People won&rsquo;t ask &ldquo;How many stars?&rdquo; They&rsquo;ll ask &ldquo;What&rsquo;s the NTB Rating?&rdquo;
      </p>

      <div className="space-y-4">
        {NTB_TIERS.map((tier, i) => (
          <div key={tier.id} className="paper-card flex items-center gap-5 rounded-md p-5">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold"
              style={{ borderColor: tier.color, color: tier.color }}
            >
              {tier.glyph}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-semibold">{tier.label}</span>
                <span className="text-xs" style={{ color: "var(--ink-soft)" }}>Tier {i + 1} of 5</span>
              </div>
              <p className="text-[15px]" style={{ color: "var(--ink-soft)" }}>{tier.tagline}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm leading-relaxed">
        The NTB Rating™ replaces traditional stars. NOT THE BEST® is built around a memorable proprietary
        rating system using the NTB icon instead of stars — because a personal memory of a meal deserves
        more nuance than five identical stars.
      </p>
    </div>
  )
}
