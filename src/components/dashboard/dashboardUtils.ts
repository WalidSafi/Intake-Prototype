import type {
  AdminTemplates,
  BookingForm,
  CalendarView,
  CompletionForm,
  RequestStatus,
  TattooRequest,
  TattooRequestAppointment,
  TattooRequestAuditEvent,
  TemplateForm,
} from './dashboardTypes'
import { initialBookingForm } from './dashboardConstants'

/** True when a request has been moved into the dashboard's Deleted folder. */
export function isArchived(request: TattooRequest) {
  return request.status === 'archived'
}

/** True when a request has not yet been opened by the artist/admin. */
export function isUnread(request: TattooRequest) {
  return request.status === 'new'
}

/** Builds a local Date from the appointment's separate date and time fields. */
export function getAppointmentStart(appointment: TattooRequestAppointment) {
  return new Date(`${appointment.date}T${appointment.startTime}`)
}

/** Formats intake submission timestamps for compact dashboard metadata. */
export function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

/** Formats appointment start times using the same compact style as submissions. */
export function formatAppointment(appointment: TattooRequestAppointment) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(getAppointmentStart(appointment))
}

/** Formats a YYYY-MM-DD calendar key as a readable day label. */
export function formatCalendarDay(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

/** Converts a Date to the YYYY-MM-DD string expected by date inputs. */
export function getDateInputValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/** Parses a date-input value at noon to avoid timezone edge cases around midnight. */
export function getDateFromInputValue(value: string) {
  return new Date(`${value}T12:00:00`)
}

/** Returns the Sunday that starts the calendar week containing the given date. */
export function getWeekStart(value: Date) {
  const start = new Date(value)
  const day = start.getDay()
  start.setDate(start.getDate() - day)

  return start
}

/** Returns the list of date-input keys needed to render the active calendar grid. */
export function getCalendarRange(
  view: CalendarView,
  focusDateValue: string,
) {
  const focusDate = getDateFromInputValue(focusDateValue)

  if (view === 'day') {
    return [focusDateValue]
  }

  if (view === 'week') {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(focusDate)
      date.setDate(focusDate.getDate() + index)

      return getDateInputValue(date)
    })
  }

  const monthStart = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1)
  const gridStart = getWeekStart(monthStart)

  // Month view always renders a six-week grid so rows do not jump between months.
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)

    return getDateInputValue(date)
  })
}

/** Builds the visible calendar heading for day, week, and month views. */
export function formatCalendarTitle(
  view: CalendarView,
  focusDateValue: string,
) {
  const focusDate = getDateFromInputValue(focusDateValue)

  if (view === 'day') {
    return formatCalendarDay(focusDateValue)
  }

  if (view === 'week') {
    const week = getCalendarRange('week', focusDateValue)
    const firstDay = week[0]
    const lastDay = week[week.length - 1]

    return `${formatCalendarDay(firstDay)} - ${formatCalendarDay(lastDay)}`
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(focusDate)
}

/** Turns prototype IDs into short display IDs for cards and audit notes. */
export function formatRequestId(id: string) {
  return id.replace('req_2026_', '#')
}

/** Formats dashboard money values for receipts, deposits, and bookkeeping rows. */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

/** Creates a complete audit event with a generated ID and current timestamp. */
export function createAuditEvent(
  requestId: string,
  input: Omit<TattooRequestAuditEvent, 'id' | 'createdAt'>,
): TattooRequestAuditEvent {
  return {
    ...input,
    id: `audit_${requestId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  }
}

/** Pre-fills the completion/payment form from any bookkeeping already saved. */
export function getCompletionFormFromRequest(
  request: TattooRequest,
): CompletionForm {
  return {
    paymentAmount: request.bookkeeping?.paymentAmount
      ? String(request.bookkeeping.paymentAmount)
      : '',
    paymentDate:
      request.bookkeeping?.paymentDate ??
      request.completedAt?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10),
    paymentMethod: request.bookkeeping?.paymentMethod ?? 'Card',
    paymentCity: request.bookkeeping?.paymentCity ?? 'Toronto',
    paymentProvince: request.bookkeeping?.paymentProvince ?? 'ON',
    sessionCount: request.bookkeeping?.sessionCount
      ? String(request.bookkeeping.sessionCount)
      : '1',
    tipAmount:
      request.bookkeeping?.tipAmount === undefined
        ? ''
        : String(request.bookkeeping.tipAmount),
    category: request.bookkeeping?.category ?? 'Tattoo service',
    notes: request.bookkeeping?.notes ?? '',
  }
}

/** Converts saved template arrays into newline-delimited textarea values. */
export function getTemplateFormFromTemplates(
  templates: AdminTemplates,
): TemplateForm {
  return {
    quoteTemplates: templates.quoteTemplates.join('\n'),
    requestFormMessage: templates.requestFormMessage,
    defaultLocation: templates.defaultLocation,
    instagramEnabled: templates.socialLinks.instagram.enabled,
    instagramUrl: templates.socialLinks.instagram.url,
    tiktokEnabled: templates.socialLinks.tiktok.enabled,
    tiktokUrl: templates.socialLinks.tiktok.url,
    websiteEnabled: templates.socialLinks.website.enabled,
    websiteUrl: templates.socialLinks.website.url,
    bookingLocations: templates.bookingLocations
      .map((location) => location.city)
      .join('\n'),
    travelDates: templates.bookingLocations
      .map((location) => `${location.city} | ${location.travelDates.join(', ')}`)
      .join('\n'),
  }
}

/** Parses dashboard travel rows like "Toronto | 2026-06-12, 2026-06-13". */
function getTravelDatesByCity(value: string) {
  return value.split('\n').reduce<Record<string, string[]>>((datesByCity, row) => {
    const [cityValue, datesValue = ''] = row.split('|')
    const city = cityValue.trim()

    if (!city) {
      return datesByCity
    }

    datesByCity[city] = datesValue
      .split(',')
      .map((date) => date.trim())
      .filter(Boolean)

    return datesByCity
  }, {})
}

/** Converts settings textarea values back into trimmed template arrays. */
export function getTemplatesFromTemplateForm(
  form: TemplateForm,
): AdminTemplates {
  const travelDatesByCity = getTravelDatesByCity(form.travelDates)
  const bookingLocations = form.bookingLocations
    .split('\n')
    .map((city) => city.trim())
    .filter(Boolean)
    .map((city) => ({
      city,
      travelDates: travelDatesByCity[city] ?? [],
    }))

  return {
    quoteTemplates: form.quoteTemplates
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    requestFormMessage: form.requestFormMessage.trim(),
    defaultLocation: form.defaultLocation.trim(),
    socialLinks: {
      instagram: {
        enabled: form.instagramEnabled,
        url: form.instagramUrl.trim(),
      },
      tiktok: {
        enabled: form.tiktokEnabled,
        url: form.tiktokUrl.trim(),
      },
      website: {
        enabled: form.websiteEnabled,
        url: form.websiteUrl.trim(),
      },
    },
    bookingLocations,
  }
}

/** Pre-fills the booking form from an existing appointment or dashboard defaults. */
export function getBookingFormFromRequest(request: TattooRequest): BookingForm {
  return request.appointment
    ? {
        date: request.appointment.date,
        startTime: request.appointment.startTime,
        durationMinutes: String(request.appointment.durationMinutes),
        service: request.appointment.service,
        depositReceived: request.appointment.depositReceived,
        notes: request.appointment.notes,
      }
    : initialBookingForm
}

/** Gathers every request field the dashboard search should match against. */
export function getRequestSearchableText(request: TattooRequest) {
  return [
    request.id,
    request.client.firstName,
    request.client.lastName,
    request.client.email,
    request.tattoo.description,
    request.tattoo.placement,
    request.tattoo.style,
    request.tattoo.colorMode,
    request.bookingLocation,
    request.travelDate,
    request.budget,
    request.status,
    request.completedAt ?? '',
    request.appointment?.date ?? '',
    request.appointment?.startTime ?? '',
    request.appointment?.service ?? '',
    request.appointment?.notes ?? '',
    // Audit and bookkeeping fields let admins find requests by operational history.
    ...(request.auditTrail ?? []).map((event) =>
      [
        event.label,
        event.type,
        event.amount ?? '',
        event.city ?? '',
        event.province ?? '',
        event.notes,
      ].join(' '),
    ),
    request.bookkeeping?.paymentMethod ?? '',
    request.bookkeeping?.paymentCity ?? '',
    request.bookkeeping?.paymentProvince ?? '',
    request.bookkeeping?.category ?? '',
    request.bookkeeping?.notes ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

/** Checks both the active workflow folder and the free-text dashboard search. */
export function requestMatchesDashboardFilter(
  request: TattooRequest,
  status: RequestStatus,
  query: string,
) {
  return (
    request.status === status &&
    getRequestSearchableText(request).includes(query.trim().toLowerCase())
  )
}
