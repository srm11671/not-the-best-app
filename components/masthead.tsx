import Link from "next/link"
import { LogoMark } from "@/components/logo-mark"
import { LogoutButton } from "@/components/logout-button"
import { createClient } from "@/lib/supabase/server"

export async function Masthead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="border-b-2 border-[--ink] pb-4 mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="group flex items-center gap-3 min-w-0">
          <LogoMark size={44} />
          <h1 className="font-display text-xl sm:text-2xl md:text-4xl font-black tracking-tight leading-tight">
            MO&apos;S NOT THE BEST<span className="align-super text-base">®</span>
          </h1>
        </a>
        <nav className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm stamp">
           <a href="/" className="hover:text-[--rust] transition-colors">
            Timeline
          </a>
          <Link href="/rating" className="hover:text-[--rust] transition-colors">
            NTB Rating™
          </Link>
          <Link
            href="/visit/new"
            className="rounded-full text-[--paper] px-4 py-2 hover:opacity-90 transition-opacity normal-case font-semibold not-italic"
            style={{ backgroundColor: "var(--ink)" }}
          >
            + Log a Visit
          </Link>
        </nav>
      </div>
      {user && (
        <div className="mt-3 flex items-center justify-between text-xs stamp" style={{ color: "var(--ink-soft)" }}>
          <span>Signed in as {user.email}</span>
          <LogoutButton />
        </div>
      )}
      <p className="mt-2 font-body italic text-sm md:text-base" style={{ color: "var(--ink-soft)" }}>
        Every meal becomes a memory. Every memory becomes knowledge. Every future dining decision becomes smarter.
      </p>
    </header>
  )
}
