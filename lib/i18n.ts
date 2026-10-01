export const LOCALES = ["en", "de"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en"

export const LOCALE_COOKIE = "locale"

export const localeNames: Record<Locale, string> = { en: "English", de: "Deutsch" }

/** Locale used for number and date formatting. */
export const intlLocales: Record<Locale, string> = { en: "en-GB", de: "de-DE" }

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale)
}

const en = {
  metadata: {
    description: "How many three-letter combinations does our company have a meaning for?",
  },
  nav: {
    label: "Main",
    home: "Home",
    scoreboard: "Scoreboard",
    search: "Search",
    submit: "Submit",
    profile: "Profile",
    language: "Language",
    signOut: "Sign out",
  },
  common: {
    points: "points",
    loading: "Loading",
    errorTitle: "Something went wrong",
    errorText: "We couldn't load this page. Please try again.",
    tryAgain: "Try again",
  },
  notFound: {
    title: "Page not found",
    description: "Not even our company has a meaning for this one. And digits don't count anyway.",
    home: "Back to home",
  },
  home: {
    question: "How many three-letter combinations does our company have a meaning for?",
    progressLabel: "Glossary progress",
    progressSummary: (discovered: string, total: string) => `${discovered} of ${total} combinations discovered`,
    discovered: "discovered",
    submitCta: "Submit an acronym",
    searchCta: "Search the glossary",
    statistics: "Statistics",
    acronymsDiscovered: "Acronyms discovered",
    meaningsDocumented: "Meanings documented",
    duplicateAcronyms: "Duplicate acronyms",
    remainingCombinations: "Remaining combinations",
  },
  scoreboard: {
    title: "Scoreboard",
    intro: "+5 for a new acronym, +10 for a new meaning of a known one, +1 for confirming an existing entry.",
    rank: "Rank",
    you: "You",
  },
  profile: {
    title: "Profile",
    score: "Score",
    rank: "Rank",
    ofTotal: (total: number) => `of ${total}`,
    submissions: "Acronyms submitted",
    newAcronyms: "New acronyms",
    duplicatesFound: "Duplicates found",
    history: "Score history",
    empty: "You haven't submitted any acronyms yet.",
    firstSubmission: "Submit your first acronym",
    transactionTypes: {
      NEW_ACRONYM: "New acronym",
      EXISTING_ENTRY: "Existing entry",
      DUPLICATE_FOUND: "Duplicate found",
    },
  },
  search: {
    title: "Search the glossary",
    intro: "Type three letters to see what they mean around here.",
    acronym: "Acronym",
    search: "Search",
    searching: "Searching…",
    notAnAcronym: (query: string) => `“${query}” is not a three-letter acronym.`,
    noMeaning: "No meaning for {code} yet.",
    add: (code: string) => `Add ${code}`,
    anotherMeaning: "Know another meaning?",
    addForPoints: "Add it for +10 points",
  },
  submit: {
    title: "Submit an acronym",
    intro: "Spotted a three-letter acronym at work? Add it to the glossary and collect points.",
    acronym: "Acronym",
    meaning: "Meaning",
    placeholder: "Apple Often Fails",
    hint: "The first letters of the words must spell the acronym.",
    initialsMatch: (acronym: string) => `Initials match ${acronym}.`,
    enterAllLetters: "Enter all three letters first.",
    submit: "Submit",
    submitting: "Submitting…",
    error: "Something went wrong while saving your acronym. Please try again.",
    viewHistory: "View your score history",
    outcomes: {
      NEW_ACRONYM: {
        title: "New acronym discovered!",
        description: "You added a new combination to the company glossary.",
      },
      EXISTING_ENTRY: {
        title: "Already known",
        description: "This acronym and meaning were already documented.",
      },
      DUPLICATE_FOUND: {
        title: "Duplicate found!",
        description: "This acronym is already used for another meaning.",
      },
      ALREADY_SUBMITTED: {
        title: "Already submitted",
        description: "You've already submitted this meaning. No points awarded.",
      },
    },
  },
  validation: {
    acronymInvalid: "Enter exactly three letters (A–Z).",
    meaningRequired: "Enter the meaning.",
    meaningTooLong: (max: number) => `Keep it under ${max} characters.`,
    initialsMismatch: (initials: string, acronym: string) => `The initials (${initials}) don't match ${acronym}.`,
  },
  acronym: {
    meanings: (count: number) => (count === 1 ? "1 meaning" : `${count} meanings`),
    addedBy: (name: string, date: string) => `Added by ${name} on ${date}`,
  },
}

export type Dictionary = typeof en

const de: Dictionary = {
  metadata: {
    description: "Für wie viele Kombinationen aus drei Buchstaben hat unser Unternehmen eine Bedeutung?",
  },
  nav: {
    label: "Hauptnavigation",
    home: "Start",
    scoreboard: "Rangliste",
    search: "Suche",
    submit: "Eintragen",
    profile: "Profil",
    language: "Sprache",
    signOut: "Abmelden",
  },
  common: {
    points: "Punkte",
    loading: "Wird geladen",
    errorTitle: "Etwas ist schiefgelaufen",
    errorText: "Die Seite konnte nicht geladen werden. Bitte versuche es erneut.",
    tryAgain: "Erneut versuchen",
  },
  notFound: {
    title: "Seite nicht gefunden",
    description: "Dafür hat nicht mal unser Unternehmen eine Bedeutung. Und Ziffern zählen sowieso nicht.",
    home: "Zur Startseite",
  },
  home: {
    question: "Für wie viele Kombinationen aus drei Buchstaben hat unser Unternehmen eine Bedeutung?",
    progressLabel: "Glossar-Fortschritt",
    progressSummary: (discovered, total) => `${discovered} von ${total} Kombinationen entdeckt`,
    discovered: "entdeckt",
    submitCta: "Abkürzung eintragen",
    searchCta: "Glossar durchsuchen",
    statistics: "Statistiken",
    acronymsDiscovered: "Entdeckte Abkürzungen",
    meaningsDocumented: "Dokumentierte Bedeutungen",
    duplicateAcronyms: "Mehrdeutige Abkürzungen",
    remainingCombinations: "Verbleibende Kombinationen",
  },
  scoreboard: {
    title: "Rangliste",
    intro: "+5 für eine neue Abkürzung, +10 für eine neue Bedeutung einer bekannten, +1 für die Bestätigung eines bestehenden Eintrags.",
    rank: "Platz",
    you: "Du",
  },
  profile: {
    title: "Profil",
    score: "Punkte",
    rank: "Platz",
    ofTotal: (total) => `von ${total}`,
    submissions: "Eingereichte Abkürzungen",
    newAcronyms: "Neue Abkürzungen",
    duplicatesFound: "Gefundene Duplikate",
    history: "Punkteverlauf",
    empty: "Du hast noch keine Abkürzungen eingetragen.",
    firstSubmission: "Erste Abkürzung eintragen",
    transactionTypes: {
      NEW_ACRONYM: "Neue Abkürzung",
      EXISTING_ENTRY: "Bekannter Eintrag",
      DUPLICATE_FOUND: "Duplikat gefunden",
    },
  },
  search: {
    title: "Glossar durchsuchen",
    intro: "Gib drei Buchstaben ein und finde heraus, was sie bei uns bedeuten.",
    acronym: "Abkürzung",
    search: "Suchen",
    searching: "Suche läuft…",
    notAnAcronym: (query) => `„${query}“ ist keine Abkürzung aus drei Buchstaben.`,
    noMeaning: "Noch keine Bedeutung für {code}.",
    add: (code) => `${code} eintragen`,
    anotherMeaning: "Kennst du eine weitere Bedeutung?",
    addForPoints: "Für +10 Punkte eintragen",
  },
  submit: {
    title: "Abkürzung eintragen",
    intro: "Bei der Arbeit über eine Abkürzung gestolpert? Trag sie ins Glossar ein und sammle Punkte.",
    acronym: "Abkürzung",
    meaning: "Bedeutung",
    placeholder: "Apple Often Fails",
    hint: "Die Anfangsbuchstaben der Wörter müssen die Abkürzung ergeben.",
    initialsMatch: (acronym) => `Die Anfangsbuchstaben ergeben ${acronym}.`,
    enterAllLetters: "Gib zuerst alle drei Buchstaben ein.",
    submit: "Eintragen",
    submitting: "Wird eingetragen…",
    error: "Beim Speichern ist etwas schiefgelaufen. Bitte versuche es erneut.",
    viewHistory: "Punkteverlauf ansehen",
    outcomes: {
      NEW_ACRONYM: {
        title: "Neue Abkürzung entdeckt!",
        description: "Du hast eine neue Kombination zum Firmenglossar hinzugefügt.",
      },
      EXISTING_ENTRY: {
        title: "Schon bekannt",
        description: "Diese Abkürzung und Bedeutung waren bereits dokumentiert.",
      },
      DUPLICATE_FOUND: {
        title: "Duplikat gefunden!",
        description: "Diese Abkürzung wird bereits für eine andere Bedeutung verwendet.",
      },
      ALREADY_SUBMITTED: {
        title: "Bereits eingetragen",
        description: "Du hast diese Bedeutung schon eingetragen. Es gibt keine Punkte.",
      },
    },
  },
  validation: {
    acronymInvalid: "Gib genau drei Buchstaben (A–Z) ein.",
    meaningRequired: "Gib die Bedeutung ein.",
    meaningTooLong: (max) => `Maximal ${max} Zeichen.`,
    initialsMismatch: (initials, acronym) => `Die Anfangsbuchstaben (${initials}) ergeben nicht ${acronym}.`,
  },
  acronym: {
    meanings: (count) => (count === 1 ? "1 Bedeutung" : `${count} Bedeutungen`),
    addedBy: (name, date) => `Hinzugefügt von ${name} am ${date}`,
  },
}

export const dictionaries: Record<Locale, Dictionary> = { en, de }
