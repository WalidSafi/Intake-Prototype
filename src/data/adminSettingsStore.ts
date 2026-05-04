const STORAGE_KEY = 'boink-admin-settings'
const LEGACY_STORAGE_KEY = 'nilab-admin-settings'
const STORE_EVENT = 'boink-admin-settings-change'

export type AdminTemplates = {
  quoteTemplates: string[]
  requestFormMessage: string
  defaultLocation: string
  bookingLocations: BookingLocation[]
}

export type BookingLocation = {
  city: string
  travelDates: string[]
}

const defaultTemplates: AdminTemplates = {
  quoteTemplates: [],
  requestFormMessage:
    'Share as much detail as you can so I can understand the piece, timing, and best city for booking.',
  defaultLocation: '',
  bookingLocations: [],
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && 'localStorage' in window
}

function addKnownQuotePrice(value: string) {
  const quote = value.trim()

  if (quote.includes('|')) {
    const [priceValue, ...textValues] = quote.split('|')
    const price = priceValue.trim()

    return price.startsWith('$')
      ? `CAD ${price} | ${textValues.join('|').trim()}`
      : quote
  }

  if (quote === 'Small tattoo quote: design prep, stencil, and one tattoo session.') {
    return 'CAD $250 - $450 | Small tattoo quote: design prep, stencil, and one tattoo session.'
  }

  if (
    quote ===
    'Custom piece quote: design time, tattoo session, and one optional touch-up review.'
  ) {
    return 'CAD $650 - $950 | Custom piece quote: design time, tattoo session, and one optional touch-up review.'
  }

  if (
    quote ===
    'Large project quote: staged design approval with multiple tattoo sessions.'
  ) {
    return 'CAD $1,500+ | Large project quote: staged design approval with multiple tattoo sessions.'
  }

  if (quote.startsWith('$')) {
    return `CAD ${quote}`
  }

  return quote
}

function normalizeTemplateList(
  value: unknown,
  fallback: string[],
  allowEmpty = false,
) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map(addKnownQuotePrice)
    .filter(Boolean)

  return normalized.length || allowEmpty ? normalized : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeTextValue(value: unknown, fallback: string) {
  return typeof value === 'string' ? value.trim() : fallback
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
        true,
      ),
      requestFormMessage:
        normalizeTextValue(
          parsedValue.requestFormMessage,
          defaultTemplates.requestFormMessage,
        ),
      defaultLocation: normalizeTextValue(
        parsedValue.defaultLocation,
        defaultTemplates.defaultLocation,
      ),
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
      true,
    ),
    requestFormMessage:
      templates.requestFormMessage.trim() || defaultTemplates.requestFormMessage,
    defaultLocation: templates.defaultLocation.trim(),
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
