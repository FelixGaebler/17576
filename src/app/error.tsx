"use client"

import { EmptyState } from "@/components/empty-state"
import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useI18n()

  return (
    <div role="alert">
      <EmptyState mood="sad" title={t.common.errorTitle} description={t.common.errorText}>
        <Button onClick={reset}>{t.common.tryAgain}</Button>
      </EmptyState>
    </div>
  )
}
