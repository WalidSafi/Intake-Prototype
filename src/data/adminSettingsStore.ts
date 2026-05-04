const STORAGE_KEY = 'boink-admin-settings'
const LEGACY_STORAGE_KEY = 'nilab-admin-settings'
const STORE_EVENT = 'boink-admin-settings-change'

export type AdminTemplates = {
  quoteTemplates: string[]
  sessionTemplates: string[]
  requestFormMessage: string
  bookingLocations: BookingLocation[]
}

export type BookingLocation = {
  city: string
  travelDates: string[]
}

const defaultTemplates: AdminTemplates = {
  quoteTemplates: [
    'Small tattoo quote: design prep, stencil, and one tattoo session.',
    'Custom piece quote: design time, tattoo session, and one optional touch-up review.',
    'Large project quote: staged design approval with multiple tattoo sessions.',
  ],
  sessionTemplates: [
    'Tattoo session',
    'Consultation',
    'Touch-up',
    'Follow-up',
  ],
  requestFormMessage:
    'Share as much detail as you can so I can understand the piece, timing, and best city for booking.',
  bookingLocations: [
    {
      city: 'Toronto',
      travelDates: ['2026-06-12', '2026-06-13', '2026-06-14'],
    },
    {
      city: 'Montreal',
      travelDates: ['2026-07-18', '2026-07-19'],
    },
  ],
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && 'localStorage' in window
}

function normalizeTemplateList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return normalized.length ? normalized : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeBookingLocations(
  value: unknown,
  fallback: BookingLocation[],
) {
  if (!Array.isArray(value)) {
    return structuredClone(fallback)
  }

  const normalized = value.flatMap((item) => {
    if (!isRecord(item) || typeof item.city !== 'string') {
      return []
    }

    const city = item.city.trim()
    if (!city) {
      return []
    }

    const travelDates = Array.isArray(item.travelDates)
      ? item.travelDates
          .filter((date): date is string => typeof date === 'string')
          .map((date) => date.trim())
          .filter(Boolean)
      : []

    return [{ city, travelDates }]
  })

  return normalized.length ? normalized : structuredClone(fallback)
}

export function getAdminTemplates(): AdminTemplates {
  if (!canUseLocalStorage()) {
    return structuredClone(defaultTemplates)
  }

  const storedValue =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_STORAGE_KEY)

  if (!storedValue) {
    return structuredClone(defaultTemplates)
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<AdminTemplates>

    return {
      quoteTemplates: normalizeTemplateList(
        parsedValue.quoteTemplates,
        defaultTemplates.quoteTemplates,
      ),
      sessionTemplates: normalizeTemplateList(
        parsedValue.sessionTemplates,
        defaultTemplates.sessionTemplates,
      ),
      requestFormMessage:
        typeof parsedValue.requestFormMessage === 'string'
          ? parsedValue.requestFormMessage.trim()
          : defaultTemplates.requestFormMessage,
      bookingLocations: normalizeBookingLocations(
        parsedValue.bookingLocations,
        defaultTemplates.bookingLocations,
      ),
    }
  } catch {
    return structuredClone(defaultTemplates)
  }
}

export function saveAdminTemplates(templates: AdminTemplates) {
  const normalizedTemplates: AdminTemplates = {
    quoteTemplates: normalizeTemplateList(
      templates.quoteTemplates,
      defaultTemplates.quoteTemplates,
    ),
    sessionTemplates: normalizeTemplateList(
      templates.sessionTemplates,
      defaultTemplates.sessionTemplates,
    ),
    requestFormMessage:
      templates.requestFormMessage.trim() || defaultTemplates.requestFormMessage,
    bookingLocations: normalizeBookingLocations(
      templates.bookingLocations,
      defaultTemplates.bookingLocations,
    ),
  }

  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedTemplates))
    window.dispatchEvent(new Event(STORE_EVENT))
  }

  return structuredClone(normalizedTemplates)
}

export function subscribeToAdminTemplates(listener: () => void) {
  if (!canUseLocalStorage()) {
    return () => {}
  }

  window.addEventListener(STORE_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(STORE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
