import { createClient } from "@/lib/supabase/server"
import { PurchaseButton } from "@/components/purchase-button"
import { LogoMark } from "@/components/logo-mark"
import { LogoutButton } from "@/components/logout-button"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function PaywallPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("paid, trial_ends_at")
    .eq("user_id", user.id)
    .maybeSingle()

  // If they already have access, don't show them a paywall.
  const trialActive = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at).getTime() > Date.now()
    : false
  if (profile?.paid || trialActive) redirect("/")

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <div className="flex flex-col items-center gap-3 mb-8">
        <LogoMark size={48} />
        <h1 className="font-display text-2xl font-black tracking-tight text-center">
          Your free trial has ended
        </h1>
        <p className="text-sm text-center" style={{ color: "var(--ink-soft)" }}>
          Your dining memories are saved and waiting — pick up right where you left off with
          lifetime access, one payment, no subscription.
        </p>
      </div>

      <div className="paper-card rounded-md p-6 mb-6">
        <PurchaseButton />
      </div>

      <div className="text-center text-xs stamp" style={{ color: "var(--ink-soft)" }}>
        <span>Signed in as {user.email} · </span>
        <LogoutButton />
      </div>
    </div>
  )
}
