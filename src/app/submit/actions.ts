"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth"
import { submitAcronym, type SubmissionResult } from "@/lib/scoring"
import { validateSubmission, type SubmissionErrors } from "@/lib/validation"

export type SubmitState =
  | { status: "idle" }
  | { status: "invalid"; errors: SubmissionErrors }
  | { status: "error" }
  | { status: "success"; result: SubmissionResult }

// Only the acronym and meaning are read from the form; points and outcome are decided on the server.
export async function submitAcronymAction(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
  const validation = validateSubmission({
    acronym: formData.get("acronym"),
    meaning: formData.get("meaning"),
  })
  if (!validation.success) return { status: "invalid", errors: validation.errors }

  try {
    const user = await getCurrentUser()
    const result = await submitAcronym(user.id, validation.data)
    revalidatePath("/", "layout")
    return { status: "success", result }
  } catch (error) {
    console.error("Submitting an acronym failed", error)
    return { status: "error" }
  }
}
