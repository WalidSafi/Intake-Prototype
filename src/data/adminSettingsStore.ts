const STORAGE_KEY = 'nilab-admin-settings'
const STORE_EVENT = 'nilab-admin-settings-change'

export type AdminTemplates = {
  quoteTemplates: string[]
  sessionTemplates: string[]
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

export function getAdminTemplates(): AdminTemplates {
  if (!canUseLocalStorage()) {
    return structuredClone(defaultTemplates)
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)

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
