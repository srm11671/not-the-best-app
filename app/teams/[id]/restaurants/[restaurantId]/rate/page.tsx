import { RestaurantRatingForm } from "@/components/restaurant-rating-form"
import { Masthead } from "@/components/masthead"
import { getTeamRestaurant } from "@/lib/team-restaurants-store"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function RateTeamRestaurantPage({
  params,
}: {
  params: { id: string; restaurantId: string }
}) {
  let restaurant
  try {
    restaurant = await getTeamRestaurant(params.id, params.restaurantId)
  } catch {
    notFound()
  }
  if (!restaurant) notFound()

  return (
    <>
      <div className="mx-auto max-w-2xl px-6 pt-10">
        <Masthead />
      </div>
      <RestaurantRatingForm
        teamId={params.id}
        mode="rate-existing"
        restaurantId={restaurant.id}
        existingRestaurantName={restaurant.restaurant}
        existingRestaurantLocation={restaurant.location}
      />
    </>
  )
}
