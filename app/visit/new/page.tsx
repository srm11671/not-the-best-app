import { NewVisitForm } from "@/components/new-visit-form"
import { Masthead } from "@/components/masthead"

export const dynamic = "force-dynamic"

export default function NewVisitPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pt-10">
        <Masthead />
      </div>
      <NewVisitForm />
    </>
  )
}
