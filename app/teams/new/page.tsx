import { NewTeamForm } from "@/components/new-team-form"
import { Masthead } from "@/components/masthead"

export const dynamic = "force-dynamic"

export default function NewTeamPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pt-10">
        <Masthead />
      </div>
      <NewTeamForm />
    </>
  )
}
