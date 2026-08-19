import { getVisit } from "@/lib/store"
import { NewVisitForm } from "@/components/new-visit-form"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export default async function EditVisitPage({ params }: { params: { id: string } }) {
  const visit = await getVisit(params.id)
  if (!visit) notFound()

  return <NewVisitForm visitId={visit.id} initialData={visit} />
}
