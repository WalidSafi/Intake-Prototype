import seedTattooRequests from './tattooRequests.json'

const STORAGE_KEY = 'nilab-tattoo-requests'
const STORE_EVENT = 'nilab-request-store-change'
const STORE_VERSION = 4
const ARTIST_ID = 'artist_001'
const ARTIST_EMAIL = 'artist@studio.test'

export type TattooRequestStatus =
  | 'new'
  | 'needs_review'
  | 'quoted'
  | 'approved_for_booking'
  | 'completed'
  | 'archived'

export type TattooRequestPhoto = {
  id: string
  label: string
  url: string
}

export type TattooRequestBookkeeping = {
  paymentAmount: number
  paymentDate: string
  paymentMethod: string
  paymentCity: string
  paymentProvince: string
  sessionCount: number
  tipAmount?: number
  category: string
  notes: string
}

export type TattooRequestAppointment = {
  date: string
  startTime: string
  durationMinutes: number
  service: string
  depositReceived: boolean
  notes: string
  bookedAt: string
}

export type TattooRequestAuditEvent = {
  id: string
  type: 'deposit_received' | 'payment_received' | 'tip_received' | 'status_changed'
  label: string
  amount?: number
  date: string
  method?: string
  city?: string
  province?: string
  notes: string
  createdAt: string
}

export type TattooRequest = {
  id: string
  artistId: string
  artistEmail: string
  client: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  tattoo: {
    description: string
    size: {
      width: number
      height: number
      unit: 'in' | 'cm'
    }
    placement: string
    placementNotes: string
    colorMode: string
    style: string
    isCoverup: string
    coverupNotes: string
  }
  photos: {
    referencePhotos: TattooRequestPhoto[]
    bodyPhotos: TattooRequestPhoto[]
  }
  budget: string
  availability: string
  status: TattooRequestStatus
  submittedAt: string
  appointment?: TattooRequestAppointment
  completedAt?: string
  bookkeeping?: TattooRequestBookkeeping
  auditTrail?: TattooRequestAuditEvent[]
  deletedAt?: string
  deletedFromStatus?: Exclude<TattooRequestStatus, 'archived'>
}

export type NewTattooRequestInput = {
  id?: string
  client: TattooRequest['client']
  tattoo: TattooRequest['tattoo']
  photos?: TattooRequest['photos']
  budget: string
  availability: string
  submittedAt?: string
}

type StoreEnvelope = {
  version: number
  requests: TattooRequest[]
}

type UpdateStatusOptions = {
  completedAt?: string | null
  bookkeeping?: TattooRequestBookkeeping | null
  auditEvent?: TattooRequestAuditEvent
  deletedAt?: string | null
  deletedFromStatus?: Exclude<TattooRequestStatus, 'archived'> | null
}

const statuses: TattooRequestStatus[] = [
  'new',
  'needs_review',
  'quoted',
  'approved_for_booking',
  'completed',
  'archived',
]

function canUseLocalStorage() {
  return typeof window !== 'undefined' && 'localStorage' in window
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asPositiveNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback
}

function asNonNegativeNumber(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : undefined
}

function normalizePhoto(value: unknown): TattooRequestPhoto | null {
  if (!isRecord(value)) {
    return null
  }

  const id = asString(value.id)
  const label = asString(value.label)
  const url = asString(value.url)

  return id && label && url ? { id, label, url } : null
}

function normalizePhotos(value: unknown) {
  const photos = Array.isArray(value) ? value : []
  return photos.flatMap((photo) => {
    const normalized = normalizePhoto(photo)
    return normalized ? [normalized] : []
  })
}

function normalizeBookkeeping(value: unknown): TattooRequestBookkeeping | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const paymentAmount = asPositiveNumber(value.paymentAmount)
  const paymentDate = asString(value.paymentDate)
  const paymentMethod = asString(value.paymentMethod)
  const paymentCity = asString(value.paymentCity)
  const paymentProvince = asString(value.paymentProvince)
  const sessionCount = asPositiveNumber(value.sessionCount, 1)
  const category = asString(value.category, 'Tattoo service')

  if (!paymentAmount || !paymentDate || !paymentMethod || !sessionCount) {
    return undefined
  }

  return {
    paymentAmount,
    paymentDate,
    paymentMethod,
    paymentCity,
    paymentProvince,
    sessionCount,
    tipAmount: asNonNegativeNumber(value.tipAmount),
    category,
    notes: asString(value.notes),
  }
}

function normalizeAuditEvent(value: unknown): TattooRequestAuditEvent | null {
  if (!isRecord(value)) {
    return null
  }

  const id = asString(value.id)
  const type = asString(value.type)
  const label = asString(value.label)
  const date = asString(value.date)
  const createdAt = asString(value.createdAt)

  if (
    !id ||
    !label ||
    !date ||
    !createdAt ||
    !['deposit_received', 'payment_received', 'tip_received', 'status_changed'].includes(type)
  ) {
    return null
  }

  return {
    id,
    type: type as TattooRequestAuditEvent['type'],
    label,
    amount: asNonNegativeNumber(value.amount),
    date,
    method: asString(value.method) || undefined,
    city: asString(value.city) || undefined,
    province: asString(value.province) || undefined,
    notes: asString(value.notes),
    createdAt,
  }
}

function normalizeAuditTrail(value: unknown) {
  const auditEvents = Array.isArray(value) ? value : []

  return auditEvents.flatMap((event) => {
    const normalized = normalizeAuditEvent(event)
    return normalized ? [normalized] : []
  })
}

function normalizeAppointment(value: unknown): TattooRequestAppointment | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const date = asString(value.date)
  const startTime = asString(value.startTime)
  const durationMinutes = asPositiveNumber(value.durationMinutes)
  const service = asString(value.service, 'Tattoo session')
  const bookedAt = asString(value.bookedAt)

  if (!date || !startTime || !durationMinutes || !service || !bookedAt) {
    return undefined
  }

  return {
    date,
    startTime,
    durationMinutes,
    service,
    depositReceived: value.depositReceived === true,
    notes: asString(value.notes),
    bookedAt,
  }
}

function normalizeRequest(value: unknown): TattooRequest | null {
  if (!isRecord(value) || !isRecord(value.client) || !isRecord(value.tattoo)) {
    return null
  }

  const id = asString(value.id)
  const artistId = asString(value.artistId)
  const artistEmail = asString(value.artistEmail)
  const rawStatus = asString(value.status)
  const status = rawStatus === 'follow_up'
    ? 'completed'
    : statuses.includes(rawStatus as TattooRequestStatus)
      ? (rawStatus as TattooRequestStatus)
      : null
  const submittedAt = asString(value.submittedAt)
  const size = isRecord(value.tattoo.size) ? value.tattoo.size : {}
  const unit = value.tattoo.size && isRecord(value.tattoo.size) && value.tattoo.size.unit === 'cm'
    ? 'cm'
    : 'in'

  if (!id || !artistId || !artistEmail || !status || !submittedAt) {
    return null
  }

  return {
    id,
    artistId,
    artistEmail,
    client: {
      firstName: asString(value.client.firstName),
      lastName: asString(value.client.lastName),
      email: asString(value.client.email),
      phone: asString(value.client.phone),
    },
    tattoo: {
      description: asString(value.tattoo.description),
      size: {
        width: asPositiveNumber(size.width),
        height: asPositiveNumber(size.height),
        unit,
      },
      placement: asString(value.tattoo.placement),
      placementNotes: asString(value.tattoo.placementNotes),
      colorMode: asString(value.tattoo.colorMode),
      style: asString(value.tattoo.style),
      isCoverup: asString(value.tattoo.isCoverup, 'No'),
      coverupNotes: asString(value.tattoo.coverupNotes),
    },
    photos: {
      referencePhotos: isRecord(value.photos)
        ? normalizePhotos(value.photos.referencePhotos)
        : [],
      bodyPhotos: isRecord(value.photos)
        ? normalizePhotos(value.photos.bodyPhotos)
        : [],
    },
    budget: asString(value.budget),
    availability: asString(value.availability),
    status,
    submittedAt,
    appointment: normalizeAppointment(value.appointment),
    completedAt: asString(value.completedAt) || undefined,
    bookkeeping: normalizeBookkeeping(value.bookkeeping),
    auditTrail: normalizeAuditTrail(value.auditTrail),
    deletedAt: asString(value.deletedAt) || undefined,
    deletedFromStatus: statuses.includes(value.deletedFromStatus as TattooRequestStatus)
      && value.deletedFromStatus !== 'archived'
      ? (value.deletedFromStatus as Exclude<TattooRequestStatus, 'archived'>)
      : undefined,
  }
}

function normalizeRequests(value: unknown) {
  const source = Array.isArray(value) ? value : []
  return source.flatMap((request) => {
    const normalized = normalizeRequest(request)
    return normalized ? [normalized] : []
  })
}

function cloneRequests(requests: TattooRequest[]) {
  return structuredClone(requests)
}

function getSeedRequests() {
  return normalizeRequests(seedTattooRequests)
}

function readStoredRequests() {
  if (!canUseLocalStorage()) {
    return null
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(storedValue)
    const requestSource =
      isRecord(parsedValue) && Array.isArray(parsedValue.requests)
        ? parsedValue.requests
        : parsedValue
    const requests = normalizeRequests(requestSource)

    return requests.length ? requests : null
  } catch {
    return null
  }
}

function writeStoredRequests(requests: TattooRequest[]) {
  if (!canUseLocalStorage()) {
    return
  }

  const envelope: StoreEnvelope = {
    version: STORE_VERSION,
    requests,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
  window.dispatchEvent(new Event(STORE_EVENT))
}

function readRequests() {
  return readStoredRequests() ?? getSeedRequests()
}

function nextRequestId(requests: TattooRequest[]) {
  const maxRequestNumber = requests.reduce((max, request) => {
    const match = request.id.match(/^req_(\d{4})_(\d+)$/)
    return match ? Math.max(max, Number(match[2])) : max
  }, 0)

  return `req_2026_${String(maxRequestNumber + 1).padStart(4, '0')}`
}

export function getAllTattooRequests() {
  return cloneRequests(readRequests())
}

export function subscribeToTattooRequests(listener: () => void) {
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

export function appendTattooRequest(input: NewTattooRequestInput) {
  const requests = readRequests()
  const newRequest = normalizeRequest({
    id: input.id ?? nextRequestId(requests),
    artistId: ARTIST_ID,
    artistEmail: ARTIST_EMAIL,
    client: input.client,
    tattoo: input.tattoo,
    photos: input.photos ?? { referencePhotos: [], bodyPhotos: [] },
    budget: input.budget,
    availability: input.availability,
    status: 'new',
    submittedAt: input.submittedAt ?? new Date().toISOString(),
  })

  if (!newRequest) {
    throw new Error('Invalid tattoo request input')
  }

  const nextRequests = [...requests, newRequest]
  writeStoredRequests(nextRequests)

  return cloneRequests([newRequest])[0]
}

export function addTattooRequest(request: NewTattooRequestInput | TattooRequest) {
  return appendTattooRequest({
    id: request.id,
    client: request.client,
    tattoo: request.tattoo,
    photos: request.photos,
    budget: request.budget,
    availability: request.availability,
    submittedAt: request.submittedAt,
  })
}

export function createTattooRequestId() {
  return nextRequestId(readRequests())
}

export function updateTattooRequestStatus(
  requestId: string,
  status: TattooRequestStatus,
  options: UpdateStatusOptions = {},
) {
  let updatedRequest: TattooRequest | null = null

  const nextRequests = readRequests().map((request) => {
    if (request.id !== requestId) {
      return request
    }

    const nextRequest: TattooRequest = {
      ...request,
      status,
    }

    if (options.completedAt === null) {
      delete nextRequest.completedAt
    } else if (options.completedAt) {
      nextRequest.completedAt = options.completedAt
    }

    if (options.bookkeeping === null) {
      delete nextRequest.bookkeeping
    } else if (options.bookkeeping) {
      const normalizedBookkeeping = normalizeBookkeeping(options.bookkeeping)
      if (!normalizedBookkeeping) {
        throw new Error('Invalid bookkeeping details')
      }
      nextRequest.bookkeeping = normalizedBookkeeping
    }

    if (options.auditEvent) {
      nextRequest.auditTrail = [
        ...(nextRequest.auditTrail ?? []),
        options.auditEvent,
      ]
    }

    if (options.deletedAt === null) {
      delete nextRequest.deletedAt
    } else if (options.deletedAt) {
      nextRequest.deletedAt = options.deletedAt
    }

    if (options.deletedFromStatus === null) {
      delete nextRequest.deletedFromStatus
    } else if (options.deletedFromStatus) {
      nextRequest.deletedFromStatus = options.deletedFromStatus
    }

    updatedRequest = nextRequest
    return nextRequest
  })

  writeStoredRequests(nextRequests)

  return updatedRequest ? cloneRequests([updatedRequest])[0] : null
}

export function appendTattooRequestAuditEvent(
  requestId: string,
  auditEvent: TattooRequestAuditEvent,
) {
  let updatedRequest: TattooRequest | null = null

  const nextRequests = readRequests().map((request) => {
    if (request.id !== requestId) {
      return request
    }

    const normalizedEvent = normalizeAuditEvent(auditEvent)
    if (!normalizedEvent) {
      throw new Error('Invalid audit event')
    }

    const nextRequest: TattooRequest = {
      ...request,
      auditTrail: [...(request.auditTrail ?? []), normalizedEvent],
    }

    updatedRequest = nextRequest
    return nextRequest
  })

  writeStoredRequests(nextRequests)

  return updatedRequest ? cloneRequests([updatedRequest])[0] : null
}

export function archiveTattooRequest(requestId: string) {
  const request = readRequests().find((item) => item.id === requestId)

  if (!request || request.status === 'archived') {
    return null
  }

  return updateTattooRequestStatus(requestId, 'archived', {
    deletedAt: new Date().toISOString(),
    deletedFromStatus: request.status,
  })
}

export function restoreArchivedTattooRequest(requestId: string) {
  const request = readRequests().find((item) => item.id === requestId)

  if (!request || request.status !== 'archived') {
    return null
  }

  return updateTattooRequestStatus(
    requestId,
    request.deletedFromStatus ?? 'needs_review',
    { deletedAt: null, deletedFromStatus: null },
  )
}

export function emptyArchivedTattooRequests() {
  const nextRequests = readRequests().filter((request) => request.status !== 'archived')
  writeStoredRequests(nextRequests)

  return cloneRequests(nextRequests)
}

export function updateTattooRequestAppointment(
  requestId: string,
  appointment: TattooRequestAppointment | null,
) {
  let updatedRequest: TattooRequest | null = null

  const nextRequests = readRequests().map((request) => {
    if (request.id !== requestId) {
      return request
    }

    const nextRequest: TattooRequest = { ...request }

    if (appointment === null) {
      delete nextRequest.appointment
    } else {
      const normalizedAppointment = normalizeAppointment(appointment)
      if (!normalizedAppointment) {
        throw new Error('Invalid appointment details')
      }
      nextRequest.appointment = normalizedAppointment
    }

    updatedRequest = nextRequest
    return nextRequest
  })

  writeStoredRequests(nextRequests)

  return updatedRequest ? cloneRequests([updatedRequest])[0] : null
}

export function seedTattooRequestStore() {
  const seedRequests = getSeedRequests()
  writeStoredRequests(seedRequests)
  return cloneRequests(seedRequests)
}

export function resetTattooRequestStore() {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return getSeedRequests()
}
