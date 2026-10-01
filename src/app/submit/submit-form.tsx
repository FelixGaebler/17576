"use client"

import { useActionState, useState, type ComponentProps } from "react"
import Link from "next/link"
import { CheckIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react"

import { AcronymCard } from "@/components/acronym-card"
import { AcronymInput } from "@/components/acronym-input"
import { useI18n } from "@/components/i18n-provider"
import { ScoreBadge } from "@/components/score-badge"
import { TileCharacter } from "@/components/tile-character"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Dictionary } from "@/lib/i18n"
import type { SubmissionOutcome, SubmissionResult } from "@/lib/scoring"
import { cn } from "@/lib/utils"
import {
  ACRONYM_LENGTH,
  getInitials,
  MEANING_MAX_LENGTH,
  validateSubmission,
  type ValidationError,
} from "@/lib/validation"
import { submitAcronymAction, type SubmitState } from "./actions"

function describeError(t: Dictionary, error: ValidationError, acronym: string, meaning: string) {
  switch (error) {
    case "initialsMismatch":
      return t.validation.initialsMismatch(getInitials(meaning), acronym.toUpperCase())
    case "meaningTooLong":
      return t.validation.meaningTooLong(MEANING_MAX_LENGTH)
    default:
      return t.validation[error]
  }
}

export function SubmitForm({ initialAcronym }: { initialAcronym: string }) {
  const { t } = useI18n()
  const [acronym, setAcronym] = useState(initialAcronym)
  const [meaning, setMeaning] = useState("")

  const [state, formAction, isPending] = useActionState(
    async (previous: SubmitState, formData: FormData) => {
      const next = await submitAcronymAction(previous, formData)
      if (next.status === "success") {
        setAcronym("")
        setMeaning("")
      }
      return next
    },
    { status: "idle" },
  )

  const validation = validateSubmission({ acronym, meaning })
  const serverErrors = state.status === "invalid" ? state.errors : {}
  const isAcronymComplete = acronym.length === ACRONYM_LENGTH
  const hasMeaning = meaning.trim().length > 0

  const acronymErrorCode = serverErrors.acronym
  const meaningErrorCode =
    serverErrors.meaning ??
    (hasMeaning && isAcronymComplete && !validation.success ? validation.errors.meaning : undefined)

  const acronymError = acronymErrorCode
    ? describeError(t, acronymErrorCode, acronym, meaning)
    : hasMeaning && !isAcronymComplete
      ? t.submit.enterAllLetters
      : undefined
  const meaningError = meaningErrorCode && describeError(t, meaningErrorCode, acronym, meaning)

  return (
    <div>
      <div aria-live="polite" className="*:mb-8">
        {state.status === "error" && (
          <p role="alert" className="rounded-3xl bg-destructive/10 p-4 text-sm text-destructive">
            {t.submit.error}
          </p>
        )}
        {state.status === "success" && <SubmissionResultPanel result={state.result} />}
      </div>

      <form action={formAction} className="space-y-6" noValidate>
        <div className="space-y-3">
          <Label htmlFor="acronym">{t.submit.acronym}</Label>
          <AcronymInput
            id="acronym"
            name="acronym"
            value={acronym}
            onChange={setAcronym}
            autoFocus={!initialAcronym}
            aria-invalid={Boolean(acronymError)}
            aria-describedby={acronymError ? "acronym-error" : undefined}
          />
          {acronymError && (
            <p id="acronym-error" className="text-sm text-destructive">
              {acronymError}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="meaning">{t.submit.meaning}</Label>
          <Input
            id="meaning"
            name="meaning"
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            placeholder={t.submit.placeholder}
            autoComplete="off"
            autoFocus={Boolean(initialAcronym)}
            className="h-11 max-w-md text-base"
            aria-invalid={Boolean(meaningError)}
            aria-describedby="meaning-hint"
          />
          <p
            id="meaning-hint"
            className={cn(
              "flex items-center gap-1.5 text-sm",
              meaningError ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {meaningError ??
              (validation.success ? (
                <>
                  <CheckIcon className="size-4 text-primary-foreground" aria-hidden />
                  {t.submit.initialsMatch(validation.data.acronym)}
                </>
              ) : (
                t.submit.hint
              ))}
          </p>
        </div>

        <Button type="submit" size="lg" disabled={!validation.success || isPending}>
          {isPending && <LoaderCircleIcon className="animate-spin" data-icon="inline-start" aria-hidden />}
          {isPending ? t.submit.submitting : t.submit.submit}
        </Button>
      </form>
    </div>
  )
}

// Same characters as docs/assets/scoring.svg.
const outcomeMoods: Record<SubmissionOutcome, ComponentProps<typeof TileCharacter>["mood"]> = {
  NEW_ACRONYM: "happy",
  DUPLICATE_FOUND: "excited",
  EXISTING_ENTRY: "confused",
  ALREADY_SUBMITTED: "sad",
}

function SubmissionResultPanel({ result }: { result: SubmissionResult }) {
  const { t } = useI18n()
  const { title, description } = t.submit.outcomes[result.outcome]
  const isDuplicate = result.outcome === "DUPLICATE_FOUND"

  return (
    <Card className={cn("text-base", isDuplicate && "border-primary bg-primary/10")}>
      <CardContent className="space-y-5">
        <div className="flex items-start gap-4">
          <TileCharacter
            mood={outcomeMoods[result.outcome]}
            className="w-14 shrink-0"
          />
          <div className="flex-1 space-y-1">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              {isDuplicate && <SparklesIcon className="size-5 text-primary-foreground" aria-hidden />}
              {title}
            </h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <ScoreBadge points={result.awardedPoints} className={cn(isDuplicate && "text-base")} />
        </div>

        {result.glossaryEntry && (
          <AcronymCard
            code={result.glossaryEntry.code}
            meanings={result.glossaryEntry.meanings}
            highlight={result.outcome === "ALREADY_SUBMITTED" ? undefined : result.meaning}
          />
        )}

        <p className="text-sm">
          <Link href="/profile" className="font-medium underline underline-offset-4">
            {t.submit.viewHistory}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
