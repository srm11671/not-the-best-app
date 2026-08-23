# not-the-best-app
NOT THE BEST — Personal Dining Memory Platform prototype

<@!-- redeploy trigger: logo fix -->

## Setup (multi-user with auth)

This app now requires each person to sign in — everyone gets their own private dining timeline.

1. **Supabase project settings** (Dashboard > Settings > API): copy your Project URL and `anon` `public` key into a `.env.local` file (see `.env.example`). Do **not** use the old service-role key in this app anymore.
2. **Enable email auth** (Dashboard > Authentication > Providers): make sure "Email" is enabled. For magic links specifically, under Authentication > Providers > Email, "Confirm email" should be on and the app uses OTP/magic-link sign-in (no password).
3. **Set the Site URL and Redirect URL** (Dashboard > Authentication > URL Configuration): add your deployed URL (and `http://localhost:3000` for local dev) to both the Site URL and the Redirect URLs list, each followed by `/auth/callback`, e.g. `https://your-app.vercel.app/auth/callback`.
4. **Run the migration**: open Dashboard > SQL Editor, paste the contents of `supabase/migrations/001_add_user_scoping.sql`, and run it. This adds a `user_id` column to `visits` and turns on Row Level Security so users can only ever see their own data.
5. **Deploy env vars**: in Vercel (or wherever you host), set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Project Settings > Environment Variables, then redeploy.

Once deployed, anyone can visit the app, enter their email, click the link they receive, and start their own private timeline.

## Setup (payment: 7-day trial, then pay-once lifetime access)

1. **Run the second migration**: in Supabase SQL Editor, run `supabase/migrations/002_add_profiles_and_paid_status.sql`. This creates a `profiles` table (one row per user, auto-created on signup) that tracks a 7-day trial window and paid status.
2. **Create your Stripe account** at stripe.com (individual/sole proprietor is fine, no business entity required in most regions).
3. **Create a one-time product**: Dashboard > Product catalog > Add product. Set pricing to "One time." Copy the resulting Price ID (`price_...`).
4. **Get your Secret key**: Dashboard > Developers > API keys > Secret key (`sk_...`).
5. **Create a webhook**: Dashboard > Developers > Webhooks > Add endpoint.
   - URL: `https://your-deployed-url/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - Copy the Signing secret (`whsec_...`)
6. **Get your Supabase service-role key**: Dashboard > Settings > API > `service_role` key. This is only ever used server-side, inside the webhook, to mark a user paid — it's never exposed to the browser.
7. **Set all the env vars** (see `.env.example`) in Vercel: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, plus the existing Supabase ones.
8. **Test in Stripe's Test mode first** (toggle top-right of the Stripe dashboard) using card `4242 4242 4242 4242`, any future expiry/CVC. Confirm a test purchase actually flips access on before switching to Live mode and repeating steps 3–5 with live keys.

How it behaves: everyone gets full access for 7 days from signup. After that, they're redirected to `/paywall` until they complete checkout — payment is one-time, and access never expires once paid.

## Setup (Baldy Eats comparison)

1. **Run the migration**: `supabase/migrations/003_add_baldy_eats_fields.sql` in Supabase's SQL Editor. Adds `baldy_rating` and `baldy_review_url` columns to `visits`.

No new env vars or accounts needed. This is manual entry only -- there's no automatic lookup or scraping. When logging a visit, you can optionally enter Baldy Eats' 0-10 score and a link to his review if you know of one. If you do, the app shows his score next to your own rating and flags whether they roughly agree (his 0-10 score is mapped to the closest NTB tier for comparison).
