"use client"

import { useState, useTransition } from "react"
import { LoaderCircleIcon, TrashIcon } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { invalidateMeaningAction } from "@/src/app/search/actions"

export function InvalidateMeaningButton({ meaningId, meaning }: { meaningId: string; meaning: string }) {
  const { t } = useI18n()
  const [isConfirming, setIsConfirming] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const errorId = `invalidate-error-${meaningId}`

  function invalidate() {
    startTransition(async () => {
      const result = await invalidateMeaningAction(meaningId)
      setHasFailed(result.status === "error")
      setIsConfirming(false)
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isConfirming ? (
        <>
          <span className="text-xs text-muted-foreground">{t.acronym.invalidateConfirm}</span>
          <Button variant="destructive" size="xs" onClick={invalidate} disabled={isPending}>
            {isPending && <LoaderCircleIcon className="animate-spin" data-icon="inline-start" aria-hidden />}
            {t.acronym.invalidate}
          </Button>
          <Button variant="ghost" size="xs" onClick={() => setIsConfirming(false)} disabled={isPending}>
            {t.acronym.cancel}
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsConfirming(true)}
          aria-label={t.acronym.invalidateLabel(meaning)}
          aria-describedby={hasFailed ? errorId : undefined}
        >
          <TrashIcon aria-hidden />
        </Button>
      )}
      {hasFailed && (
        <p id={errorId} role="alert" className="w-full text-right text-xs text-destructive">
          {t.acronym.invalidateError}
        </p>
      )}
    </div>
  )
}
