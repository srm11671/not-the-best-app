import { RestaurantRatingForm } from "@/components/restaurant-rating-form"
import { Masthead } from "@/components/masthead"

export const dynamic = "force-dynamic"

export default function NewTeamRestaurantPage({ params }: { params: { id: string } }) {
  return (
    <>
      <div className="mx-auto max-w-2xl px-6 pt-10">
        <Masthead />
      </div>
      <RestaurantRatingForm teamId={params.id} mode="new" />
    </>
  )
}
