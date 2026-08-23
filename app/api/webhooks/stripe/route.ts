import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.supabase_user_id ?? session.client_reference_id

    if (userId) {
      const supabase = createAdminClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          paid: true,
          paid_at: new Date().toISOString(),
          stripe_customer_id: session.customer as string | null,
          stripe_checkout_session_id: session.id,
        })
        .eq("user_id", userId)

      if (error) {
        console.error("Failed to mark user as paid:", error.message)
        return NextResponse.json({ error: "Database update failed" }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
