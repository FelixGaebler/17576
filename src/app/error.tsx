"use client"

import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useI18n()

  return (
    <div role="alert" className="space-y-4 rounded-3xl border border-dashed p-8 text-center">
      <h1 className="text-xl font-semibold">{t.common.errorTitle}</h1>
      <p className="text-muted-foreground">{t.common.errorText}</p>
      <Button onClick={reset}>{t.common.tryAgain}</Button>
    </div>
  )
}
