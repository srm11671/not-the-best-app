import { JoinTeamForm } from "@/components/join-team-form"
import { Masthead } from "@/components/masthead"

export const dynamic = "force-dynamic"

export default function JoinTeamPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pt-10">
        <Masthead />
      </div>
      <JoinTeamForm />
    </>
  )
}
