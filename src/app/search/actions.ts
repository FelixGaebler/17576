"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentUser } from "@/lib/auth"
import { invalidateMeaning } from "@/lib/scoring"

export type InvalidateMeaningState = { status: "idle" | "error" }

export async function invalidateMeaningAction(meaningId: string): Promise<InvalidateMeaningState> {
  const user = await getCurrentUser()
  if (!user.isAdmin) return { status: "error" }

  const id = z.uuid().safeParse(meaningId)
  if (!id.success) return { status: "error" }

  try {
    await invalidateMeaning(id.data)
  } catch (error) {
    console.error("Invalidating a meaning failed", error)
    return { status: "error" }
  }

  revalidatePath("/", "layout")
  return { status: "idle" }
}
