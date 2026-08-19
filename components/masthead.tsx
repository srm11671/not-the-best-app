import Link from "next/link"
import { LogoMark } from "@/components/logo-mark"

export function Masthead() {
  return (
    <header className="border-b-2 border-[--ink] pb-4 mb-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <LogoMark size={52} />
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight">
            NOT THE BEST<span className="align-super text-lg">®</span>
          </h1>
        </Link>
        <nav className="flex items-center gap-6 text-sm stamp">
          <Link href="/" className="hover:text-[--rust] transition-colors">
            Timeline
          </Link>
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
      <p className="mt-2 font-body italic text-sm md:text-base" style={{ color: "var(--ink-soft)" }}>
        Every meal becomes a memory. Every memory becomes knowledge. Every future dining decision becomes smarter.
      </p>
    </header>
  )
}
