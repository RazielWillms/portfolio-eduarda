import { activities } from "@/lib/activities"
import { ActivitiesPageClient } from "@/components/activities-page-client"

export default function AtividadesPage() {
  return <ActivitiesPageClient activities={activities} />
}