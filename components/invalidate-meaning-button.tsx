"use client"

import { useState, useTransition } from "react"
import { LoaderCircleIcon, TrashIcon, XIcon } from "lucide-react"

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
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {isConfirming ? (
          <>
            <Button variant="destructive" size="xs" onClick={invalidate} disabled={isPending} autoFocus>
              {isPending ? (
                <LoaderCircleIcon className="animate-spin" data-icon="inline-start" aria-hidden />
              ) : (
                <TrashIcon data-icon="inline-start" aria-hidden />
              )}
              {t.acronym.invalidate}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsConfirming(false)}
              disabled={isPending}
              aria-label={t.acronym.cancel}
            >
              <XIcon aria-hidden />
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
      </div>
      {hasFailed && (
        <p id={errorId} role="alert" className="max-w-48 text-right text-xs text-destructive">
          {t.acronym.invalidateError}
        </p>
      )}
    </div>
  )
}
