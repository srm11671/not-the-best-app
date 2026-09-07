import { NewVisitForm } from "@/components/new-visit-form"
import { Masthead } from "@/components/masthead"
import { getTeam } from "@/lib/teams-store"

export const dynamic = "force-dynamic"

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: { teamId?: string }
}) {
  const teamId = searchParams.teamId
  const team = teamId ? await getTeam(teamId).catch(() => undefined) : undefined

  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pt-10">
        <Masthead />
      </div>
      <NewVisitForm teamId={team?.id} teamName={team?.name} />
    </>
  )
}
