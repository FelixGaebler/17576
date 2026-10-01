import { Skeleton } from "@/components/ui/skeleton"
import { getI18n } from "@/lib/i18n-server"

export default async function Loading() {
  const { t } = await getI18n()

  return (
    <div className="space-y-6" aria-busy="true" aria-label={t.common.loading}>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-48 w-full rounded-3xl" />
    </div>
  )
}
