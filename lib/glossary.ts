import { getDb } from "@/src/prisma/db"

export const TOTAL_COMBINATIONS = 26 * 26 * 26

export async function getGlossaryProgress() {
  const db = getDb()

  const [acronyms, meanings, ambiguousAcronyms] = await Promise.all([
    db.orm.public.Acronym.aggregate((a) => ({ count: a.count() })),
    db.orm.public.Meaning.aggregate((a) => ({ count: a.count() })),
    db.orm.public.Meaning.groupBy("acronymId")
      .having((having) => having.count().gt(1))
      .aggregate((a) => ({ count: a.count() })),
  ])

  return {
    discovered: acronyms.count,
    remaining: TOTAL_COMBINATIONS - acronyms.count,
    percentage: (acronyms.count / TOTAL_COMBINATIONS) * 100,
    meanings: meanings.count,
    duplicates: ambiguousAcronyms.length,
  }
}

export async function findAcronym(code: string) {
  const acronym = await getDb()
    .orm.public.Acronym.where({ code })
    .include("meanings", (meanings) =>
      meanings
        .select("id", "text", "createdAt")
        .include("createdBy", (user) => user.select("displayName"))
        .orderBy([(m) => m.createdAt.asc(), (m) => m.id.asc()]),
    )
    .first()

  if (!acronym) return null

  return {
    code: acronym.code,
    meanings: acronym.meanings.map((meaning) => ({
      id: meaning.id,
      text: meaning.text,
      addedBy: meaning.createdBy.displayName,
      addedAt: new Date(meaning.createdAt.epochMilliseconds),
    })),
  }
}
