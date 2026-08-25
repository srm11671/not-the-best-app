export function TestingNotice() {
  if (process.env.REQUIRE_AUTH === "true") return null

  return (
    <div
      className="mb-6 rounded-md border px-4 py-2 text-xs text-center"
      style={{ borderColor: "var(--line)", color: "var(--ink-soft)", backgroundColor: "var(--paper-dark)" }}
    >
      This site is currently in production testing with daily updates and is shared with everyone I&apos;ve
      invited — not yet the private, personal-only experience it will become.
    </div>
  )
}