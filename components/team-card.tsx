import Link from "next/link"
import { Team } from "@/types"
import { Users, Lock, Globe } from "lucide-react"

interface TeamCardProps {
  team: Team
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="paper-card block rounded-md p-6 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl font-semibold">{team.name}</h3>
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
          style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
        >
          {team.visibility === "public" ? (
            <>
              <Globe className="h-3 w-3" /> Public
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" /> Private
            </>
          )}
        </span>
      </div>
      {typeof team.memberCount === "number" && (
        <div className="mt-2 inline-flex items-center gap-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          <Users className="h-3.5 w-3.5" /> {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
        </div>
      )}
    </Link>
  )
}
