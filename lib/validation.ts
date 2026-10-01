import { z } from "zod"

export const ACRONYM_LENGTH = 3

export const MEANING_MAX_LENGTH = 120

/** Error codes instead of messages, so the UI can translate them. */
const VALIDATION_ERRORS = ["acronymInvalid", "meaningRequired", "meaningTooLong", "initialsMismatch"] as const

export type ValidationError = (typeof VALIDATION_ERRORS)[number]

function isValidationError(message: string): message is ValidationError {
  return (VALIDATION_ERRORS as readonly string[]).includes(message)
}

export function normalizeAcronym(acronym: string) {
  return acronym.trim().toUpperCase()
}

export function isValidAcronym(acronym: string) {
  return /^[A-Z]{3}$/.test(acronym)
}

/** Trims and collapses whitespace. This is the form we store and display. */
function formatMeaning(meaning: string) {
  return meaning.trim().replace(/\s+/g, " ")
}

/** The form used to decide whether two meanings are the same. */
export function normalizeMeaning(meaning: string) {
  return formatMeaning(meaning).toLowerCase()
}

export function getInitials(meaning: string) {
  return formatMeaning(meaning)
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join("")
}

function meaningMatchesAcronym(acronym: string, meaning: string) {
  return getInitials(meaning) === normalizeAcronym(acronym)
}

const acronymSchema = z
  .string()
  .transform(normalizeAcronym)
  .refine(isValidAcronym, "acronymInvalid")

export const submissionSchema = z
  .object({
    acronym: acronymSchema,
    meaning: z
      .string()
      .transform(formatMeaning)
      .pipe(
        z
          .string()
          .min(1, "meaningRequired")
          .max(MEANING_MAX_LENGTH, "meaningTooLong"),
      ),
  })
  // Only runs once both fields passed their own checks.
  .superRefine(({ acronym, meaning }, context) => {
    if (!meaningMatchesAcronym(acronym, meaning)) {
      context.addIssue({ code: "custom", path: ["meaning"], message: "initialsMismatch" })
    }
  })

export type Submission = z.infer<typeof submissionSchema>

export type SubmissionErrors = Partial<Record<keyof Submission, ValidationError>>

export function validateSubmission(
  input: unknown,
): { success: true; data: Submission } | { success: false; errors: SubmissionErrors } {
  const result = submissionSchema.safeParse(input)
  if (result.success) return { success: true, data: result.data }

  const errors: SubmissionErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if ((field === "acronym" || field === "meaning") && !errors[field]) {
      // Type errors (e.g. a missing field) come with Zod's own message.
      const fallback = field === "acronym" ? "acronymInvalid" : "meaningRequired"
      errors[field] = isValidationError(issue.message) ? issue.message : fallback
    }
  }
  return { success: false, errors }
}
