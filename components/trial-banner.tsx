import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export async function TrialBanner() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("paid, trial_ends_at")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile || profile.paid || !profile.trial_ends_at) return null

  const msRemaining = new Date(profile.trial_ends_at).getTime() - Date.now()
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
  if (daysRemaining <= 0) return null

  return (
    <div
      className="mb-6 flex items-center justify-between rounded-md border px-4 py-2 text-sm"
      style={{ borderColor: "var(--rust)", color: "var(--rust)" }}
    >
      <span>
        {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left in your free trial
      </span>
      <Link href="/paywall" className="underline decoration-dotted underline-offset-4 font-semibold">
        Get lifetime access
      </Link>
    </div>
  )
}
