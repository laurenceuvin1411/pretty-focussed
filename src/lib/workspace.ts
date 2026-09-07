// Wie is de eigenaar van deze OS-installatie?
// De eigenaar ziet haar eigen seed-content (Kompas, projecten, recepten).
// Elke andere gebruiker start met een lege template en vult alles zelf in.

export const OWNER_EMAIL = 'hello@laurenceuvin.com'

let currentEmail: string | null = null

export function setCurrentUser(email: string | null | undefined) {
  currentEmail = email?.trim().toLowerCase() ?? null
  // Zustand-stores lezen dit bij het opstarten; bij wissel van account
  // herlaadt App de pagina zodat elke store zijn eigen opslagsleutel pakt.
}

export function getCurrentEmail(): string | null {
  return currentEmail
}

export function isOwner(): boolean {
  return (currentEmail ?? getStoredEmail()) === OWNER_EMAIL
}

// Voornaam voor de begroeting op de Overview
export function firstName(): string {
  if (!currentEmail) return ''
  if (currentEmail === OWNER_EMAIL) return 'Laurence'
  const local = currentEmail.split('@')[0].split(/[._-]/)[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

// Opslagsleutel per account: zo houden twee gebruikers op hetzelfde toestel
// hun eigen recepten, doelen, protocollen enzovoort gescheiden.
// De eigenaar houdt de originele sleutels, zodat haar bestaande data blijft staan.
export function scopedKey(base: string): string {
  const email = getStoredEmail()
  if (!email || email === OWNER_EMAIL) return base
  return `${base}::${email}`
}

// Stores worden aangemaakt vóór de sessie geladen is: gebruik het onthouden
// account om te beslissen of de seed-content (Laurence' eigen data) meekomt.
export function isOwnerAccount(): boolean {
  const email = getStoredEmail()
  // Geen bekend account (eerste bezoek, uitgelogd): behandel als eigenaar,
  // zodat Laurence' bestaande installatie ongewijzigd blijft werken.
  return email === null || email === OWNER_EMAIL
}

// De stores worden aangemaakt vóór de sessie geladen is, dus lezen we het
// laatst bekende account uit localStorage.
const LAST_USER_KEY = 'laurence-os-last-user'

export function getStoredEmail(): string | null {
  try { return localStorage.getItem(LAST_USER_KEY) } catch { return null }
}

export function rememberUser(email: string | null | undefined) {
  try {
    const clean = email?.trim().toLowerCase() ?? null
    const previous = getStoredEmail()
    // Bij uitloggen (clean === null) bewaren we het laatst bekende account,
    // zodat de opslag-scheiding stabiel blijft tot iemand anders inlogt.
    if (clean) localStorage.setItem(LAST_USER_KEY, clean)
    setCurrentUser(clean ?? previous)
    // Ander account dan de vorige sessie: herladen zodat alle stores
    // opnieuw opbouwen met de juiste opslagsleutels.
    return previous !== null && clean !== null && previous !== clean
  } catch {
    return false
  }
}
