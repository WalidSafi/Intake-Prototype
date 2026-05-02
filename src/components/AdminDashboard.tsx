import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  appendTattooRequestAuditEvent,
  archiveTattooRequest,
  emptyArchivedTattooRequests,
  getAllTattooRequests as getRequests,
  restoreArchivedTattooRequest,
  subscribeToTattooRequests as subscribeToRequests,
  updateTattooRequestAppointment as updateRequestAppointment,
  updateTattooRequestStatus as updateRequestStatus,
  type TattooRequest,
  type TattooRequestAuditEvent,
  type TattooRequestAppointment,
  type TattooRequestBookkeeping,
  type TattooRequestStatus as RequestStatus,
} from '../data/tattooRequestStore'
import {
  getAdminTemplates,
  saveAdminTemplates,
  subscribeToAdminTemplates,
  type AdminTemplates,
} from '../data/adminSettingsStore'
import users from '../data/users.json'

type FolderKey = RequestStatus
type CalendarView = 'day' | 'week' | 'month'
type CompletionForm = {
  paymentAmount: string
  paymentDate: string
  paymentMethod: string
  paymentCity: string
  paymentProvince: string
  sessionCount: string
  tipAmount: string
  category: string
  notes: string
}
type DepositForm = {
  amount: string
  date: string
  method: string
  city: string
  province: string
  notes: string
}
type BookingForm = {
  date: string
  startTime: string
  durationMinutes: string
  service: string
  depositReceived: boolean
  notes: string
}
type TemplateForm = {
  quoteTemplates: string
  sessionTemplates: string
}

const statusLabel: Record<RequestStatus, string> = {
  new: 'Unread',
  needs_review: 'Needs review',
  quoted: 'Quoted',
  approved_for_booking: 'Ready to book',
  completed: 'Completed',
  archived: 'Deleted',
}

const statusClass: Record<RequestStatus, string> = {
  new: 'border-[#d76749] bg-[#fff1eb] text-[#8f3524]',
  needs_review: 'border-[#c6a13f] bg-[#fff7d8] text-[#6d5413]',
  quoted: 'border-[#6ba978] bg-[#eef8f0] text-[#276037]',
  approved_for_booking: 'border-[#638ab7] bg-[#edf4ff] text-[#2c547f]',
  completed: 'border-[#8d7a6c] bg-[#f4eee8] text-[#5a4d46]',
  archived: 'border-[#aa5757] bg-[#fff0f0] text-[#743030]',
}

const folderStatuses: FolderKey[] = [
  'new',
  'needs_review',
  'quoted',
  'approved_for_booking',
  'completed',
  'archived',
]

const initialCompletionForm: CompletionForm = {
  paymentAmount: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'Card',
  paymentCity: 'Toronto',
  paymentProvince: 'ON',
  sessionCount: '1',
  tipAmount: '',
  category: 'Tattoo service',
  notes: '',
}

const initialDepositForm: DepositForm = {
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  method: 'Card',
  city: 'Toronto',
  province: 'ON',
  notes: '',
}

const initialBookingForm: BookingForm = {
  date: new Date().toISOString().slice(0, 10),
  startTime: '10:00',
  durationMinutes: '120',
  service: 'Tattoo session',
  depositReceived: true,
  notes: '',
}

function isArchived(request: TattooRequest) {
  return request.status === 'archived'
}

function isUnread(request: TattooRequest) {
  return request.status === 'new'
}

function getAppointmentStart(appointment: TattooRequestAppointment) {
  return new Date(`${appointment.date}T${appointment.startTime}`)
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatAppointment(appointment: TattooRequestAppointment) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(getAppointmentStart(appointment))
}

function formatCalendarDay(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function getDateInputValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDateFromInputValue(value: string) {
  return new Date(`${value}T12:00:00`)
}

function getWeekStart(value: Date) {
  const start = new Date(value)
  const day = start.getDay()
  start.setDate(start.getDate() - day)

  return start
}

function getCalendarRange(view: CalendarView, focusDateValue: string) {
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

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)

    return getDateInputValue(date)
  })
}

function formatCalendarTitle(view: CalendarView, focusDateValue: string) {
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

function formatRequestId(id: string) {
  return id.replace('req_2026_', '#')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function createAuditEvent(
  requestId: string,
  input: Omit<TattooRequestAuditEvent, 'id' | 'createdAt'>,
): TattooRequestAuditEvent {
  return {
    ...input,
    id: `audit_${requestId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  }
}

function getCompletionFormFromRequest(request: TattooRequest): CompletionForm {
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

function getTemplateFormFromTemplates(templates: AdminTemplates): TemplateForm {
  return {
    quoteTemplates: templates.quoteTemplates.join('\n'),
    sessionTemplates: templates.sessionTemplates.join('\n'),
  }
}

function getTemplatesFromTemplateForm(form: TemplateForm): AdminTemplates {
  return {
    quoteTemplates: form.quoteTemplates
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    sessionTemplates: form.sessionTemplates
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  }
}

function getBookingFormFromRequest(request: TattooRequest): BookingForm {
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

export default function AdminDashboard() {
  const [filter, setFilter] = useState<FolderKey>('new')
  const [query, setQuery] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [requestRecords, setRequestRecords] = useState<TattooRequest[]>(getRequests)
  const [templates, setTemplates] = useState<AdminTemplates>(getAdminTemplates)
  const [templateForm, setTemplateForm] = useState<TemplateForm>(() =>
    getTemplateFormFromTemplates(getAdminTemplates()),
  )
  const [selectedQuoteTemplate, setSelectedQuoteTemplate] = useState('')
  const [depositRequestId, setDepositRequestId] = useState<string | null>(null)
  const [depositForm, setDepositForm] = useState<DepositForm>(initialDepositForm)
  const [bookingRequestId, setBookingRequestId] = useState<string | null>(null)
  const [bookingForm, setBookingForm] = useState<BookingForm>(initialBookingForm)
  const [completionRequestId, setCompletionRequestId] = useState<string | null>(null)
  const [completionForm, setCompletionForm] = useState<CompletionForm>(
    initialCompletionForm,
  )
  const [statusMessage, setStatusMessage] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarView, setCalendarView] = useState<CalendarView>('week')
  const [calendarFocusDate, setCalendarFocusDate] = useState(
    getDateInputValue(new Date()),
  )

  const artist = users.find((user) => user.permissions.includes('adminPanel'))

  useEffect(
    () => subscribeToRequests(() => setRequestRecords(getRequests())),
    [],
  )

  useEffect(
    () =>
      subscribeToAdminTemplates(() => {
        const nextTemplates = getAdminTemplates()
        setTemplates(nextTemplates)
        setTemplateForm(getTemplateFormFromTemplates(nextTemplates))
      }),
    [],
  )

  const artistRequests = useMemo(
    () =>
      [...requestRecords]
        .filter((request) => request.artistId === artist?.id)
        .sort(
          (first, second) =>
            new Date(second.submittedAt).getTime() -
            new Date(first.submittedAt).getTime(),
        ),
    [artist?.id, requestRecords],
  )

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return artistRequests.filter((request) => {
      const matchesFilter = request.status === filter

      const searchableText = [
        request.id,
        request.client.firstName,
        request.client.lastName,
        request.client.email,
        request.tattoo.description,
        request.tattoo.placement,
        request.tattoo.style,
        request.tattoo.colorMode,
        request.budget,
        request.status,
        request.completedAt ?? '',
        request.appointment?.date ?? '',
        request.appointment?.startTime ?? '',
        request.appointment?.service ?? '',
        request.appointment?.notes ?? '',
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

      return matchesFilter && searchableText.includes(normalizedQuery)
    })
  }, [artistRequests, filter, query])

  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedRequestId) ??
    artistRequests.find((request) => request.id === selectedRequestId) ??
    filteredRequests[0] ??
    artistRequests[0]

  const filters: Array<{
    key: FolderKey
    label: string
    count: number
  }> = folderStatuses.map((status) => ({
    key: status,
    label: statusLabel[status],
    count: artistRequests.filter((request) => request.status === status).length,
  }))

  const currentFilterLabel =
    filters.find((item) => item.key === filter)?.label ?? 'Requests'
  const scheduledRequests = artistRequests
    .filter((request) => request.appointment && request.status !== 'archived')
    .sort((first, second) => {
      const firstStart = first.appointment
        ? getAppointmentStart(first.appointment).getTime()
        : 0
      const secondStart = second.appointment
        ? getAppointmentStart(second.appointment).getTime()
        : 0

      return firstStart - secondStart
    })
  const calendarDays = getCalendarRange(calendarView, calendarFocusDate)
  const calendarFocusMonth = getDateFromInputValue(calendarFocusDate).getMonth()

  const changeSelectedStatus = (status: RequestStatus) => {
    if (!selectedRequest) {
      return
    }

    setBookingRequestId(null)

    if (status === 'completed') {
      setCompletionRequestId(selectedRequest.id)
      setCompletionForm(getCompletionFormFromRequest(selectedRequest))
      return
    }

    setCompletionRequestId(null)
    updateRequestStatus(
      selectedRequest.id,
      status,
      { completedAt: null, bookkeeping: null },
    )
    setStatusMessage(`Moved ${formatRequestId(selectedRequest.id)} to ${statusLabel[status]}.`)
  }

  const selectRequest = (request: TattooRequest) => {
    setSelectedRequestId(request.id)

    if (request.status === 'new') {
      updateRequestStatus(request.id, 'needs_review', {
        auditEvent: createAuditEvent(request.id, {
          type: 'status_changed',
          label: 'Opened by admin',
          date: new Date().toISOString().slice(0, 10),
          notes: 'Auto-moved from Unread to Needs review when opened.',
        }),
      })
      setStatusMessage(`${formatRequestId(request.id)} moved to Needs review.`)
    }
  }

  const openDepositForm = () => {
    if (!selectedRequest) {
      return
    }

    setBookingRequestId(null)
    setCompletionRequestId(null)
    setDepositRequestId(selectedRequest.id)
    setDepositForm(initialDepositForm)
  }

  const updateDepositField = <Field extends keyof DepositForm>(
    field: Field,
    value: DepositForm[Field],
  ) => {
    setDepositForm((current) => ({ ...current, [field]: value }))
  }

  const confirmDeposit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedRequest) {
      return
    }

    const depositAmount = Number(depositForm.amount)

    if (
      !Number.isFinite(depositAmount) ||
      depositAmount <= 0 ||
      !depositForm.date ||
      !depositForm.method ||
      !depositForm.city.trim() ||
      !depositForm.province.trim()
    ) {
      setStatusMessage('Enter deposit amount, method, city, and province before confirming.')
      return
    }

    updateRequestStatus(selectedRequest.id, 'approved_for_booking', {
      auditEvent: createAuditEvent(selectedRequest.id, {
        type: 'deposit_received',
        label: 'Deposit received',
        amount: depositAmount,
        date: depositForm.date,
        method: depositForm.method,
        city: depositForm.city.trim(),
        province: depositForm.province.trim(),
        notes: depositForm.notes.trim(),
      }),
    })
    setDepositRequestId(null)
    setFilter('approved_for_booking')
    setStatusMessage(`Deposit confirmed. ${formatRequestId(selectedRequest.id)} is ready to book.`)
  }

  const markQuotedWithTemplate = () => {
    if (!selectedRequest || !selectedQuoteTemplate) {
      return
    }

    updateRequestStatus(selectedRequest.id, 'quoted', {
      completedAt: null,
      bookkeeping: null,
      auditEvent: createAuditEvent(selectedRequest.id, {
        type: 'status_changed',
        label: 'Quote template applied',
        date: new Date().toISOString().slice(0, 10),
        notes: selectedQuoteTemplate,
      }),
    })
    setFilter('quoted')
    setStatusMessage(`Marked ${formatRequestId(selectedRequest.id)} as quoted.`)
  }

  const saveTemplateSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextTemplates = saveAdminTemplates(getTemplatesFromTemplateForm(templateForm))
    setTemplates(nextTemplates)
    setTemplateForm(getTemplateFormFromTemplates(nextTemplates))
    setStatusMessage('Template settings saved.')
  }

  const updateTemplateForm = <Field extends keyof TemplateForm>(
    field: Field,
    value: TemplateForm[Field],
  ) => {
    setTemplateForm((current) => ({ ...current, [field]: value }))
  }

  const openBookingForm = () => {
    if (!selectedRequest) {
      return
    }

    setCompletionRequestId(null)
    setBookingRequestId(selectedRequest.id)
    const nextBookingForm = getBookingFormFromRequest(selectedRequest)
    setBookingForm(nextBookingForm)
    setCalendarFocusDate(nextBookingForm.date)
  }

  const updateBookingField = <Field extends keyof BookingForm>(
    field: Field,
    value: BookingForm[Field],
  ) => {
    setBookingForm((current) => ({ ...current, [field]: value }))
    if (field === 'date' && typeof value === 'string') {
      setCalendarFocusDate(value)
    }
  }

  const updateCompletionField = <Field extends keyof CompletionForm>(
    field: Field,
    value: CompletionForm[Field],
  ) => {
    setCompletionForm((current) => ({ ...current, [field]: value }))
  }

  const saveBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedRequest || !artist?.permissions.includes('adminPanel')) {
      return
    }

    if (
      selectedRequest.status !== 'approved_for_booking' &&
      selectedRequest.status !== 'completed'
    ) {
      setStatusMessage('Move this client to Ready to book, or schedule it from Completed as a touch-up.')
      return
    }

    if (selectedRequest.status === 'approved_for_booking' && !bookingForm.depositReceived) {
      setStatusMessage('Confirm the deposit is received before booking.')
      return
    }

    const durationMinutes = Number(bookingForm.durationMinutes)

    if (!bookingForm.date || !bookingForm.startTime || !Number.isFinite(durationMinutes) || durationMinutes < 30) {
      setStatusMessage('Enter a valid date, start time, and duration before booking.')
      return
    }

    updateRequestAppointment(selectedRequest.id, {
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      durationMinutes,
      service: bookingForm.service.trim() || 'Tattoo session',
      depositReceived: bookingForm.depositReceived,
      notes: bookingForm.notes.trim(),
      bookedAt: selectedRequest.appointment?.bookedAt ?? new Date().toISOString(),
    })
    setStatusMessage(`Booked ${formatRequestId(selectedRequest.id)} for ${bookingForm.date} at ${bookingForm.startTime}.`)
    setBookingRequestId(null)
  }

  const clearBooking = () => {
    if (!selectedRequest) {
      return
    }

    updateRequestAppointment(selectedRequest.id, null)
    setStatusMessage(`Removed booking for ${formatRequestId(selectedRequest.id)}.`)
    setBookingRequestId(null)
  }

  const deleteSelectedRequest = () => {
    if (!selectedRequest || selectedRequest.status === 'archived') {
      return
    }

    const confirmed = window.confirm(
      `Move ${selectedRequest.client.firstName} ${selectedRequest.client.lastName} to Deleted? You can restore it from the Deleted folder.`,
    )

    if (!confirmed) {
      return
    }

    archiveTattooRequest(selectedRequest.id)
    setBookingRequestId(null)
    setCompletionRequestId(null)
    setSelectedRequestId(null)
    setStatusMessage(`Moved ${formatRequestId(selectedRequest.id)} to Deleted.`)
  }

  const restoreSelectedRequest = () => {
    if (!selectedRequest || selectedRequest.status !== 'archived') {
      return
    }

    const restoredRequest = restoreArchivedTattooRequest(selectedRequest.id)
    if (!restoredRequest) {
      return
    }

    setFilter(restoredRequest.status)
    setStatusMessage(`Restored ${formatRequestId(selectedRequest.id)} to ${statusLabel[restoredRequest.status]}.`)
  }

  const emptyDeletedFolder = () => {
    const deletedCount = artistRequests.filter(isArchived).length

    if (deletedCount === 0) {
      setStatusMessage('Deleted folder is already empty.')
      return
    }

    const confirmed = window.confirm(
      `Permanently empty the Deleted folder? This will remove ${deletedCount} request${deletedCount === 1 ? '' : 's'} from this browser's prototype storage.`,
    )

    if (!confirmed) {
      return
    }

    emptyArchivedTattooRequests()
    setSelectedRequestId(null)
    setStatusMessage('Deleted folder emptied.')
  }

  const saveCompletion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedRequest) {
      return
    }

    const paymentAmount = Number(completionForm.paymentAmount)
    const sessionCount = Number(completionForm.sessionCount)
    const tipAmount = completionForm.tipAmount
      ? Number(completionForm.tipAmount)
      : undefined

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0 ||
      !completionForm.paymentCity.trim() ||
      !completionForm.paymentProvince.trim() ||
      !Number.isFinite(sessionCount) ||
      sessionCount < 1 ||
      (tipAmount !== undefined && (!Number.isFinite(tipAmount) || tipAmount < 0))
    ) {
      setStatusMessage('Enter valid payment, session, and tip amounts before saving.')
      return
    }

    const bookkeeping: TattooRequestBookkeeping = {
      paymentAmount,
      paymentDate: completionForm.paymentDate,
      paymentMethod: completionForm.paymentMethod,
      paymentCity: completionForm.paymentCity.trim(),
      paymentProvince: completionForm.paymentProvince.trim(),
      sessionCount,
      tipAmount,
      category: completionForm.category.trim(),
      notes: completionForm.notes.trim(),
    }

    const paymentAuditEvent = createAuditEvent(selectedRequest.id, {
      type: 'payment_received',
      label: 'Final payment received',
      amount: paymentAmount,
      date: completionForm.paymentDate,
      method: completionForm.paymentMethod,
      city: completionForm.paymentCity.trim(),
      province: completionForm.paymentProvince.trim(),
      notes: completionForm.notes.trim(),
    })

    updateRequestStatus(selectedRequest.id, 'completed', {
      completedAt: new Date(`${completionForm.paymentDate}T12:00:00`).toISOString(),
      bookkeeping,
      auditEvent: paymentAuditEvent,
    })
    if (tipAmount && tipAmount > 0) {
      appendTattooRequestAuditEvent(
        selectedRequest.id,
        createAuditEvent(selectedRequest.id, {
          type: 'tip_received',
          label: 'Tip received',
          amount: tipAmount,
          date: completionForm.paymentDate,
          method: completionForm.paymentMethod,
          city: completionForm.paymentCity.trim(),
          province: completionForm.paymentProvince.trim(),
          notes: completionForm.notes.trim(),
        }),
      )
    }
    setStatusMessage(`Completed ${formatRequestId(selectedRequest.id)} and saved bookkeeping.`)
    setCompletionRequestId(null)
  }

  const shellClass = isDark
    ? 'min-h-screen bg-[#181514] text-[#fffaf5]'
    : 'min-h-screen bg-[#f7f0e8] text-[#201b18]'
  const panelClass = isDark
    ? 'border-[#3c332e] bg-[#211d1a]'
    : 'border-[#dbd1c5] bg-white'
  const mutedTextClass = isDark ? 'text-[#cbbdb3]' : 'text-[#7a6a60]'
  const compactInputClass = `h-[38px] rounded-lg border bg-transparent px-3 text-sm font-semibold outline-none transition focus:border-[#b95f43] focus:ring-3 focus:ring-[#b95f43]/20 ${
    isDark
      ? 'border-[#3c332e] text-[#fffaf5] placeholder:text-[#8f8178]'
      : 'border-[#c9beb1] text-[#201b18] placeholder:text-[#9a8b81]'
  }`
  const compactTextareaClass = `min-h-[74px] rounded-lg border bg-transparent px-3 py-2 text-sm font-semibold outline-none transition focus:border-[#b95f43] focus:ring-3 focus:ring-[#b95f43]/20 ${
    isDark
      ? 'border-[#3c332e] text-[#fffaf5] placeholder:text-[#8f8178]'
      : 'border-[#c9beb1] text-[#201b18] placeholder:text-[#9a8b81]'
  }`
  const calendarGridClass =
    calendarView === 'day'
      ? 'grid gap-2'
      : calendarView === 'week'
        ? 'grid gap-2 sm:grid-cols-2 xl:grid-cols-7'
        : 'grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7'
  const renderCalendarPanel = (isBookingPanel = false) => (
    <div
      className={`grid gap-3 rounded-lg border p-4 ${
        isDark
          ? 'border-[#3c332e] bg-[#181514]'
          : 'border-[#eadfd4] bg-[#fbf6f0]'
      }`}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="m-0 text-sm font-bold">
            {isBookingPanel ? 'Availability calendar' : 'Calendar'}
          </h3>
          <p className={`m-0 text-xs font-bold ${mutedTextClass}`}>
            {formatCalendarTitle(calendarView, calendarFocusDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={compactInputClass}
            type="date"
            value={calendarFocusDate}
            onChange={(event) => setCalendarFocusDate(event.target.value)}
            aria-label="Calendar focus date"
          />
          {(['day', 'week', 'month'] as CalendarView[]).map((view) => {
            const isActive = calendarView === view

            return (
              <button
                className={`min-h-[34px] rounded-lg border px-3 text-xs font-bold capitalize transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                  isActive
                    ? 'border-[#b95f43] bg-[#8f4536] text-white'
                    : isDark
                      ? 'border-[#3c332e] bg-[#211d1a] text-[#cbbdb3]'
                      : 'border-[#c9beb1] bg-white text-[#5a4d46]'
                }`}
                key={view}
                type="button"
                onClick={() => setCalendarView(view)}
              >
                {view}
              </button>
            )
          })}
        </div>
      </div>

      <div className={calendarGridClass}>
        {calendarDays.map((day) => {
          const dayRequests = scheduledRequests.filter(
            (request) => request.appointment?.date === day,
          )
          const isOutsideMonth =
            calendarView === 'month' &&
            getDateFromInputValue(day).getMonth() !== calendarFocusMonth

          return (
            <div
              className={`min-h-[132px] rounded-lg border p-2 ${
                isDark
                  ? 'border-[#3c332e] bg-[#211d1a]'
                  : 'border-[#dbd1c5] bg-white'
              } ${isOutsideMonth ? 'opacity-55' : ''}`}
              key={day}
            >
              <p className="m-0 text-xs font-bold text-[#b95f43]">
                {formatCalendarDay(day)}
              </p>
              <div className="mt-2 grid gap-2">
                {dayRequests.map((request) => (
                  <button
                    className={`rounded-md border px-2 py-1 text-left text-xs font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                      isDark
                        ? 'border-[#4a382f] bg-[#181514]'
                        : 'border-[#eadfd4] bg-[#fbf6f0]'
                    }`}
                    key={request.id}
                    type="button"
                    onClick={() => {
                      setSelectedRequestId(request.id)
                      if (!isBookingPanel) {
                        setShowCalendar(false)
                      }
                    }}
                  >
                    <span className="block text-[#b95f43]">
                      {request.appointment?.startTime}
                    </span>
                    <span className="block">
                      {request.client.firstName} {request.client.lastName}
                    </span>
                    <span className={`block ${mutedTextClass}`}>
                      {request.appointment?.service}
                    </span>
                  </button>
                ))}
                {dayRequests.length === 0 && (
                  <span className={`text-xs font-semibold ${mutedTextClass}`}>
                    Open
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <main className={shellClass}>
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={`border-b px-4 py-5 lg:border-b-0 lg:border-r lg:px-5 ${
            isDark ? 'border-[#3c332e] bg-[#171311]' : 'border-[#dbd1c5] bg-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <a
              className="grid size-10 place-items-center rounded-lg text-[#b95f43] transition hover:bg-[#f1e5da]"
              href="#"
              aria-label="Home"
              title="Home"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m3 11 9-8 9 8" />
                <path d="M5 10v10h14V10" />
                <path d="M9 20v-6h6v6" />
              </svg>
            </a>
            <button
              className={`grid size-10 place-items-center rounded-lg border transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                showSettings
                  ? 'border-[#b95f43] bg-[#8f4536] text-white'
                  : `${panelClass} ${mutedTextClass}`
              }`}
              type="button"
              onClick={() => setShowSettings((current) => !current)}
              aria-label="Open settings"
              title="Settings"
            >
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.07A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.07A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.07A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.07A1.7 1.7 0 0 0 19.4 15Z" />
              </svg>
            </button>
          </div>

          <div className="mt-8 grid gap-2">
            <p className="m-0 text-lg font-bold tracking-[0.12em] text-[#b95f43] uppercase">
              {
                artist?.name
            }
            </p>
            { artist?.socials?.instagram && (
              <a className="m-0 text-lg font-bold tracking-[0.12em] text-[#b95f43] uppercase" href={artist.socials.instagram}>
              
              <svg 
                  xmlns="http://w3.org" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
            </a>
            )}
            <h1 className="m-0 text-3xl leading-tight font-bold">
              Inbox
            </h1>
          </div>

          {showSettings && (
            <form
              className={`mt-6 grid gap-3 rounded-lg border p-3 ${panelClass}`}
              onSubmit={saveTemplateSettings}
            >
              <div>
                <h2 className="m-0 text-base font-bold">Settings</h2>
                <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
                  Templates show up in quote and booking workflows.
                </p>
              </div>
              <label className="grid gap-1 text-xs font-bold uppercase">
                Quote templates
                <textarea
                  className={compactTextareaClass}
                  value={templateForm.quoteTemplates}
                  onChange={(event) =>
                    updateTemplateForm('quoteTemplates', event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase">
                Session templates
                <textarea
                  className={compactTextareaClass}
                  value={templateForm.sessionTemplates}
                  onChange={(event) =>
                    updateTemplateForm('sessionTemplates', event.target.value)
                  }
                />
              </label>
              <button
                className="min-h-[36px] rounded-lg bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25"
                type="submit"
              >
                Save settings
              </button>
            </form>
          )}

          <nav className="mt-8 grid gap-2" aria-label="Request filters">
            {filters.map((item) => {
              const isActive = filter === item.key

              return (
                <button
                  className={`flex min-h-[46px] items-center justify-between rounded-lg border px-3 text-left text-sm font-bold transition ${
                    isActive
                      ? 'border-[#b95f43] bg-[#8f4536] text-white'
                      : `${panelClass} ${mutedTextClass} hover:border-[#b95f43]`
                  }`}
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                >
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDark
                          ? 'bg-[#302925] text-[#f3d6ca]'
                          : 'bg-[#f1e5da] text-[#7a4638]'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              )
            })}
          </nav>
          {filter === 'archived' && (
            <button
              className={`mt-4 min-h-[42px] w-full rounded-lg border px-3 text-sm font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                isDark
                  ? 'border-[#5b3838] bg-[#2b1d1d] text-[#f0c4c4]'
                  : 'border-[#d8aaaa] bg-[#fff5f5] text-[#743030]'
              }`}
              type="button"
              onClick={emptyDeletedFolder}
            >
              Empty Deleted
            </button>
          )}
        </aside>

        <section className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)]">
          <header
            className={`border-b px-4 py-4 sm:px-6 lg:px-8 ${
              isDark ? 'border-[#3c332e] bg-[#211d1a]' : 'border-[#dbd1c5] bg-white/75'
            }`}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_minmax(280px,420px)_minmax(140px,1fr)] xl:items-center">
              <div className="flex items-center gap-3">
                <div
                  className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#8f4536] font-bold text-white"
                  aria-label="Artist avatar placeholder"
                >
                  {artist?.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div>
                  <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                    Dashboard
                  </p>
                  <h2 className="m-0 text-2xl leading-tight font-bold">
                    {artist?.name}
                  </h2>
                </div>
              </div>

              <label className="relative block min-w-0 xl:justify-self-center xl:w-full">
                  <span className="sr-only">Search requests</span>
                  <span
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${mutedTextClass}`}
                    aria-hidden="true"
                  >
                    Search
                  </span>
                  <input
                    className={`h-[44px] w-full rounded-lg border bg-transparent px-3 pl-[72px] text-sm font-semibold outline-none transition focus:border-[#b95f43] focus:ring-3 focus:ring-[#b95f43]/20 ${
                      isDark
                        ? 'border-[#3c332e] text-[#fffaf5] placeholder:text-[#8f8178]'
                        : 'border-[#c9beb1] text-[#201b18] placeholder:text-[#9a8b81]'
                    }`}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Client, style, placement..."
                  />
                </label>

              <div className="flex items-center gap-3 xl:justify-self-end">
                <button
                  className={`grid size-11 place-items-center rounded-lg border transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 focus-visible:ring-offset-2 ${
                    isDark
                      ? `${panelClass} focus-visible:ring-offset-[#211d1a]`
                      : `${panelClass} focus-visible:ring-offset-white`
                  }`}
                  type="button"
                  aria-label="Open calendar"
                  title="Open calendar"
                  onClick={() => setShowCalendar((current) => !current)}
                >
                  <svg
                    aria-hidden="true"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect height="18" rx="2" width="18" x="3" y="4" />
                    <path d="M3 10h18" />
                  </svg>
                </button>
                <button
                  className={`grid size-11 place-items-center rounded-lg border transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 focus-visible:ring-offset-2 ${
                    isDark
                      ? `${panelClass} focus-visible:ring-offset-[#211d1a]`
                      : `${panelClass} focus-visible:ring-offset-white`
                  }`}
                  type="button"
                  onClick={() => setIsDark((current) => !current)}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <svg
                    aria-hidden="true"
                    className="size-5"
                    fill={isDark ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M12 2a7 7 0 0 0-4 12.74V16h8v-1.26A7 7 0 0 0 12 2Z" />
                  </svg>
                </button>
              </div>
            </div>
            {showCalendar && <div className="mt-4">{renderCalendarPanel()}</div>}
          </header>

          <div className="grid min-h-0 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)] lg:p-8">
            <section
              className={`grid min-h-0 content-start overflow-hidden rounded-lg border ${panelClass}`}
              aria-labelledby="inbox-heading"
            >
              <div className="flex items-center justify-between gap-3 border-b border-inherit px-4 py-3">
                <div>
                  <p className="m-0 text-xs font-bold tracking-[0.12em] text-[#b95f43] uppercase">
                    Workflow folder
                  </p>
                  <h2 className="m-0 text-xl font-bold" id="inbox-heading">
                    {statusLabel[filter]}
                  </h2>
                </div>
                <span className={`text-sm font-bold ${mutedTextClass}`}>
                  {filteredRequests.length} shown
                </span>
              </div>

              <div className="grid max-h-[680px] overflow-auto">
                {filteredRequests.map((request) => {
                  const selected = selectedRequest?.id === request.id

                  return (
                    <button
                      className={`grid w-full gap-3 border-b border-inherit p-4 text-left transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/30 ${
                        selected
                          ? isDark
                            ? 'bg-[#322620] ring-1 ring-inset ring-[#b95f43]'
                            : 'bg-[#fff3ea] ring-1 ring-inset ring-[#b95f43]'
                          : isDark
                            ? 'hover:bg-[#26211e]'
                            : 'hover:bg-[#faf5ef]'
                      }`}
                      key={request.id}
                      type="button"
                      onClick={() => selectRequest(request)}
                      aria-pressed={selected}
                      aria-label={`Show intake details for ${request.client.firstName} ${request.client.lastName}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {isUnread(request) && (
                              <span className="size-2 rounded-full bg-[#d76749]" />
                            )}
                            {isArchived(request) && (
                              <span className="rounded-full bg-[#f1e5da] px-2 py-0.5 text-[0.68rem] font-bold tracking-[0.08em] text-[#7a4638] uppercase">
                                Deleted
                              </span>
                            )}
                            <h3 className="m-0 truncate text-lg font-bold">
                              {request.client.firstName}{' '}
                              {request.client.lastName}
                            </h3>
                          </div>
                          <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                            {request.tattoo.style} / {request.tattoo.placement}
                          </p>
                        </div>
                        <span className={`shrink-0 text-xs font-bold ${mutedTextClass}`}>
                          {formatSubmittedAt(request.submittedAt)}
                        </span>
                      </div>

                      <p className={`m-0 line-clamp-2 text-sm ${mutedTextClass}`}>
                        {request.tattoo.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-bold ${
                            statusClass[request.status]
                          }`}
                        >
                          {statusLabel[request.status]}
                        </span>
                        <span className={`text-xs font-bold ${mutedTextClass}`}>
                          {formatRequestId(request.id)}
                        </span>
                        {request.completedAt && (
                          <span className={`text-xs font-bold ${mutedTextClass}`}>
                            Finished {formatSubmittedAt(request.completedAt)}
                          </span>
                        )}
                        {request.appointment && (
                          <span className={`text-xs font-bold ${mutedTextClass}`}>
                            Booked {formatAppointment(request.appointment)}
                          </span>
                        )}
                        <span className={`text-xs font-bold ${mutedTextClass}`}>
                          {request.photos.referencePhotos.length +
                            request.photos.bodyPhotos.length}{' '}
                          photos
                        </span>
                      </div>
                    </button>
                  )
                })}

                {filteredRequests.length === 0 && (
                  <div className="grid min-h-[240px] place-items-center p-6 text-center">
                    <div>
                      <p className="m-0 text-lg font-bold">No matching forms</p>
                      <p className={`m-0 mt-1 text-sm font-semibold ${mutedTextClass}`}>
                        Try another {currentFilterLabel.toLowerCase()} search term.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section
              className={`grid content-start gap-5 rounded-lg border p-5 ${panelClass}`}
              aria-label="Request preview"
            >
              {statusMessage && (
                <p
                  className={`m-0 rounded-lg border px-3 py-2 text-sm font-bold ${
                    isDark
                      ? 'border-[#4a382f] bg-[#1b1715] text-[#f3d6ca]'
                      : 'border-[#dfc8ba] bg-[#fff8f3] text-[#7a4638]'
                  }`}
                  role="status"
                >
                  {statusMessage}
                </p>
              )}
              {selectedRequest ? (
                <>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="m-0 text-xs font-bold tracking-[0.12em] text-[#b95f43] uppercase">
                        {isArchived(selectedRequest)
                          ? 'Deleted request'
                          : 'Selected form'}
                      </p>
                      <h2 className="m-0 text-3xl leading-tight font-bold">
                        {selectedRequest.client.firstName}{' '}
                        {selectedRequest.client.lastName}
                      </h2>
                      <p className={`m-0 mt-1 text-sm font-semibold ${mutedTextClass}`}>
                        {selectedRequest.client.email} /{' '}
                        {selectedRequest.client.phone}
                      </p>
                    </div>
                    <div className="grid gap-2 xl:justify-items-end">
                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                          statusClass[selectedRequest.status]
                        }`}
                      >
                        {statusLabel[selectedRequest.status]}
                      </span>
                      {selectedRequest.status !== 'archived' && (
                        <div
                          className="flex max-w-[360px] flex-wrap gap-2 xl:justify-end"
                          aria-label="Change selected request status"
                        >
                          {folderStatuses
                            .filter((status) => status !== 'archived')
                            .map((status) => {
                              const isCurrent = selectedRequest.status === status

                              return (
                                <button
                                  className={`min-h-[34px] rounded-lg border px-3 text-xs font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                                    isCurrent
                                      ? 'border-[#b95f43] bg-[#8f4536] text-white'
                                      : isDark
                                        ? 'border-[#3c332e] bg-[#211d1a] text-[#cbbdb3] hover:border-[#b95f43]'
                                        : 'border-[#c9beb1] bg-white text-[#5a4d46] hover:border-[#b95f43]'
                                  }`}
                                  key={status}
                                  type="button"
                                  onClick={() => changeSelectedStatus(status)}
                                  aria-pressed={isCurrent}
                                >
                                  {statusLabel[status]}
                                </button>
                              )
                            })}
                        </div>
                      )}
                      {artist?.permissions.includes('adminPanel') && (
                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          {selectedRequest.status !== 'archived' &&
                            selectedRequest.status !== 'completed' && (
                              <button
                                className={`min-h-[38px] w-fit rounded-lg border px-3 text-xs font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                                  isDark
                                    ? 'border-[#3c332e] bg-[#211d1a] text-[#cbbdb3]'
                                    : 'border-[#c9beb1] bg-white text-[#5a4d46]'
                                }`}
                                type="button"
                                onClick={openDepositForm}
                              >
                                Confirm deposit
                              </button>
                            )}
                          {selectedRequest.status !== 'archived' && (
                            <button
                              className={`min-h-[38px] w-fit rounded-lg border px-3 text-xs font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                                selectedRequest.status === 'approved_for_booking' ||
                                selectedRequest.status === 'completed'
                                  ? 'border-[#b95f43] bg-[#8f4536] text-white'
                                  : isDark
                                    ? 'border-[#3c332e] bg-[#211d1a] text-[#8f8178]'
                                    : 'border-[#c9beb1] bg-white text-[#9a8b81]'
                              }`}
                              type="button"
                              onClick={openBookingForm}
                            >
                              {selectedRequest.appointment
                                ? 'Edit booking'
                                : 'Book session'}
                            </button>
                          )}
                          {selectedRequest.status === 'archived' ? (
                            <button
                              className="min-h-[38px] w-fit rounded-lg border border-[#b95f43] bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25"
                              type="button"
                              onClick={restoreSelectedRequest}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              className={`min-h-[38px] w-fit rounded-lg border px-3 text-xs font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                                isDark
                                  ? 'border-[#5b3838] bg-[#2b1d1d] text-[#f0c4c4]'
                                  : 'border-[#d8aaaa] bg-[#fff5f5] text-[#743030]'
                              }`}
                              type="button"
                              onClick={deleteSelectedRequest}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRequest.status !== 'archived' && (
                    <div
                      className={`grid gap-3 rounded-lg border p-4 ${
                        isDark
                          ? 'border-[#3c332e] bg-[#181514]'
                          : 'border-[#eadfd4] bg-[#fbf6f0]'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="m-0 text-lg font-bold">Quote templates</h3>
                          <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                            Pick a saved quote shortcut, then mark this request quoted.
                          </p>
                        </div>
                        <button
                          className="min-h-[34px] rounded-lg bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={!selectedQuoteTemplate}
                          onClick={markQuotedWithTemplate}
                        >
                          Mark quoted
                        </button>
                      </div>
                      <select
                        className={compactInputClass}
                        value={selectedQuoteTemplate}
                        onChange={(event) =>
                          setSelectedQuoteTemplate(event.target.value)
                        }
                      >
                        <option value="">Choose quote template</option>
                        {templates.quoteTemplates.map((template) => (
                          <option key={template} value={template}>
                            {template}
                          </option>
                        ))}
                      </select>
                      {selectedQuoteTemplate && (
                        <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
                          {selectedQuoteTemplate}
                        </p>
                      )}
                    </div>
                  )}

                  {depositRequestId === selectedRequest.id && (
                    <form
                      className={`grid gap-4 rounded-lg border p-4 ${
                        isDark
                          ? 'border-[#4a382f] bg-[#1b1715]'
                          : 'border-[#dfc8ba] bg-[#fff8f3]'
                      }`}
                      onSubmit={confirmDeposit}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="m-0 text-base font-bold">
                            Deposit received
                          </h3>
                          <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
                            Confirming a deposit moves the client to Ready to book.
                          </p>
                        </div>
                        <button
                          className="min-h-[34px] rounded-lg bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25"
                          type="submit"
                        >
                          Save deposit
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Amount
                          <input
                            className={compactInputClass}
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={depositForm.amount}
                            onChange={(event) =>
                              updateDepositField('amount', event.target.value)
                            }
                            placeholder="100.00"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Date
                          <input
                            className={compactInputClass}
                            type="date"
                            required
                            value={depositForm.date}
                            onChange={(event) =>
                              updateDepositField('date', event.target.value)
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Method
                          <select
                            className={compactInputClass}
                            value={depositForm.method}
                            onChange={(event) =>
                              updateDepositField('method', event.target.value)
                            }
                          >
                            <option>Card</option>
                            <option>Cash</option>
                            <option>Transfer</option>
                            <option>Other</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          City
                          <input
                            className={compactInputClass}
                            required
                            value={depositForm.city}
                            onChange={(event) =>
                              updateDepositField('city', event.target.value)
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Province
                          <input
                            className={compactInputClass}
                            required
                            value={depositForm.province}
                            onChange={(event) =>
                              updateDepositField('province', event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <label className="grid gap-1 text-xs font-bold uppercase">
                        Deposit notes
                        <textarea
                          className={compactTextareaClass}
                          value={depositForm.notes}
                          onChange={(event) =>
                            updateDepositField('notes', event.target.value)
                          }
                          placeholder="Receipt, transfer reference, tax note..."
                        />
                      </label>
                    </form>
                  )}

                  {bookingRequestId === selectedRequest.id && (
                    <form
                      className={`grid gap-4 rounded-lg border p-4 ${
                        isDark
                          ? 'border-[#4a382f] bg-[#1b1715]'
                          : 'border-[#dfc8ba] bg-[#fff8f3]'
                      }`}
                      onSubmit={saveBooking}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="m-0 text-base font-bold">
                            Admin booking
                          </h3>
                          <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
                            {selectedRequest.status === 'completed'
                              ? 'Schedule touch-ups or healed-work check-ins.'
                              : 'Deposit received clients can be placed on the schedule.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.appointment && (
                            <button
                              className={`min-h-[34px] rounded-lg border px-3 text-xs font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                                isDark
                                  ? 'border-[#3c332e] bg-[#211d1a] text-[#cbbdb3]'
                                  : 'border-[#c9beb1] bg-white text-[#5a4d46]'
                              }`}
                              type="button"
                              onClick={clearBooking}
                            >
                              Remove
                            </button>
                          )}
                          <button
                            className="min-h-[34px] rounded-lg bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25"
                            type="submit"
                          >
                            Save booking
                          </button>
                        </div>
                      </div>

                      {renderCalendarPanel(true)}

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Date
                          <input
                            className={compactInputClass}
                            type="date"
                            required
                            value={bookingForm.date}
                            onChange={(event) =>
                              updateBookingField('date', event.target.value)
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Start
                          <input
                            className={compactInputClass}
                            type="time"
                            required
                            value={bookingForm.startTime}
                            onChange={(event) =>
                              updateBookingField('startTime', event.target.value)
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Minutes
                          <input
                            className={compactInputClass}
                            type="number"
                            min="30"
                            step="15"
                            required
                            value={bookingForm.durationMinutes}
                            onChange={(event) =>
                              updateBookingField(
                                'durationMinutes',
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Service
                          <select
                            className={compactInputClass}
                            value={bookingForm.service}
                            onChange={(event) =>
                              updateBookingField('service', event.target.value)
                            }
                          >
                            {templates.sessionTemplates.map((template) => (
                              <option key={template}>{template}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-bold uppercase">
                        <input
                          className="size-4 accent-[#8f4536]"
                          type="checkbox"
                          checked={bookingForm.depositReceived}
                          onChange={(event) =>
                            updateBookingField(
                              'depositReceived',
                              event.target.checked,
                            )
                          }
                        />
                        Deposit received
                      </label>

                      <label className="grid gap-1 text-xs font-bold uppercase">
                        Booking notes
                        <textarea
                          className={compactTextareaClass}
                          value={bookingForm.notes}
                          onChange={(event) =>
                            updateBookingField('notes', event.target.value)
                          }
                          placeholder="Prep notes, stencil timing, touch-up area, supplies..."
                        />
                      </label>
                    </form>
                  )}

                  {completionRequestId === selectedRequest.id && (
                    <form
                      className={`grid gap-4 rounded-lg border p-4 ${
                        isDark
                          ? 'border-[#4a382f] bg-[#1b1715]'
                          : 'border-[#dfc8ba] bg-[#fff8f3]'
                      }`}
                      onSubmit={saveCompletion}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="m-0 text-base font-bold">
                            Complete work
                          </h3>
                          <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
                            Add payment and tax details before moving this request.
                          </p>
                        </div>
                        <button
                          className="min-h-[34px] rounded-lg bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25"
                          type="submit"
                        >
                          Save completed
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Payment
                          <input
                            className={compactInputClass}
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={completionForm.paymentAmount}
                            onChange={(event) =>
                              updateCompletionField(
                                'paymentAmount',
                                event.target.value,
                              )
                            }
                            placeholder="450.00"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Payment date
                          <input
                            className={compactInputClass}
                            type="date"
                            required
                            value={completionForm.paymentDate}
                            onChange={(event) =>
                              updateCompletionField(
                                'paymentDate',
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Method
                          <select
                            className={compactInputClass}
                            value={completionForm.paymentMethod}
                            onChange={(event) =>
                              updateCompletionField(
                                'paymentMethod',
                                event.target.value,
                              )
                            }
                          >
                            <option>Card</option>
                            <option>Cash</option>
                            <option>Transfer</option>
                            <option>Deposit applied</option>
                            <option>Other</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Sessions
                          <input
                            className={compactInputClass}
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={completionForm.sessionCount}
                            onChange={(event) =>
                              updateCompletionField(
                                'sessionCount',
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          City
                          <input
                            className={compactInputClass}
                            required
                            value={completionForm.paymentCity}
                            onChange={(event) =>
                              updateCompletionField(
                                'paymentCity',
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Province
                          <input
                            className={compactInputClass}
                            required
                            value={completionForm.paymentProvince}
                            onChange={(event) =>
                              updateCompletionField(
                                'paymentProvince',
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Tip
                          <input
                            className={compactInputClass}
                            type="number"
                            min="0"
                            step="0.01"
                            value={completionForm.tipAmount}
                            onChange={(event) =>
                              updateCompletionField('tipAmount', event.target.value)
                            }
                            placeholder="0.00"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-bold uppercase">
                          Category
                          <input
                            className={compactInputClass}
                            required
                            value={completionForm.category}
                            onChange={(event) =>
                              updateCompletionField('category', event.target.value)
                            }
                            placeholder="Tattoo service"
                          />
                        </label>
                      </div>

                      <label className="grid gap-1 text-xs font-bold uppercase">
                        Bookkeeping notes
                        <textarea
                          className={compactTextareaClass}
                          value={completionForm.notes}
                          onChange={(event) =>
                            updateCompletionField('notes', event.target.value)
                          }
                          placeholder="Receipt notes, tax category, supplies, deposit details..."
                        />
                      </label>
                    </form>
                  )}

                  <div
                    className={`rounded-lg border p-4 ${
                      isDark
                        ? 'border-[#3c332e] bg-[#181514]'
                        : 'border-[#eadfd4] bg-[#fbf6f0]'
                    }`}
                  >
                    <p className="m-0 text-lg leading-relaxed">
                      {selectedRequest.tattoo.description}
                    </p>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: 'Placement',
                        value: selectedRequest.tattoo.placement,
                      },
                      {
                        label: 'Size',
                        value: `${selectedRequest.tattoo.size.width} x ${selectedRequest.tattoo.size.height} ${selectedRequest.tattoo.size.unit}`,
                      },
                      { label: 'Style', value: selectedRequest.tattoo.style },
                      {
                        label: 'Color',
                        value: selectedRequest.tattoo.colorMode,
                      },
                      { label: 'Budget', value: selectedRequest.budget },
                      {
                        label: 'Submitted',
                        value: formatSubmittedAt(selectedRequest.submittedAt),
                      },
                      ...(selectedRequest.appointment
                        ? [
                            {
                              label: 'Booked',
                              value: formatAppointment(selectedRequest.appointment),
                            },
                            {
                              label: 'Booking type',
                              value: `${selectedRequest.appointment.service} / ${selectedRequest.appointment.durationMinutes} min`,
                            },
                          ]
                        : []),
                      ...(selectedRequest.completedAt
                        ? [
                            {
                              label: 'Completed',
                              value: formatSubmittedAt(selectedRequest.completedAt),
                            },
                          ]
                        : []),
                    ].map((item) => (
                      <div
                        className={`rounded-lg border p-3 ${
                          isDark
                            ? 'border-[#3c332e] bg-[#181514]'
                            : 'border-[#eadfd4] bg-[#fbf6f0]'
                        }`}
                        key={item.label}
                      >
                        <dt className={`text-xs font-bold uppercase ${mutedTextClass}`}>
                          {item.label}
                        </dt>
                        <dd className="m-0 mt-1 font-bold">{item.value}</dd>
                      </div>
                    ))}
                  </dl>

                  {selectedRequest.appointment && (
                    <div
                      className={`grid gap-2 rounded-lg border p-4 ${
                        isDark
                          ? 'border-[#3c332e] bg-[#181514]'
                          : 'border-[#eadfd4] bg-[#fbf6f0]'
                      }`}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="m-0 text-lg font-bold">Booking</h3>
                          <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                            {selectedRequest.appointment.service}
                          </p>
                        </div>
                        <span className="font-bold">
                          {formatAppointment(selectedRequest.appointment)}
                        </span>
                      </div>
                      <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                        {selectedRequest.appointment.depositReceived
                          ? 'Deposit received'
                          : 'No deposit marked'}
                        {' / '}
                        {selectedRequest.appointment.durationMinutes} minutes
                      </p>
                      {selectedRequest.appointment.notes && (
                        <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
                          {selectedRequest.appointment.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedRequest.bookkeeping && (
                    <div
                      className={`grid gap-3 rounded-lg border p-4 ${
                        isDark
                          ? 'border-[#3c332e] bg-[#181514]'
                          : 'border-[#eadfd4] bg-[#fbf6f0]'
                      }`}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="m-0 text-lg font-bold">
                            Bookkeeping
                          </h3>
                          <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                            {selectedRequest.bookkeeping.category}
                          </p>
                        </div>
                        <strong className="text-xl">
                          {formatCurrency(
                            selectedRequest.bookkeeping.paymentAmount +
                              (selectedRequest.bookkeeping.tipAmount ?? 0),
                          )}
                        </strong>
                      </div>
                      <dl className="grid gap-2 sm:grid-cols-2">
                        {[
                          {
                            label: 'Payment',
                            value: formatCurrency(
                              selectedRequest.bookkeeping.paymentAmount,
                            ),
                          },
                          {
                            label: 'Tip',
                            value: formatCurrency(
                              selectedRequest.bookkeeping.tipAmount ?? 0,
                            ),
                          },
                          {
                            label: 'Payment date',
                            value: selectedRequest.bookkeeping.paymentDate,
                          },
                          {
                            label: 'Method',
                            value: selectedRequest.bookkeeping.paymentMethod,
                          },
                          {
                            label: 'Received in',
                            value: [
                              selectedRequest.bookkeeping.paymentCity,
                              selectedRequest.bookkeeping.paymentProvince,
                            ]
                              .filter(Boolean)
                              .join(', '),
                          },
                          {
                            label: 'Sessions',
                            value: `${selectedRequest.bookkeeping.sessionCount}`,
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <dt className={`text-xs font-bold uppercase ${mutedTextClass}`}>
                              {item.label}
                            </dt>
                            <dd className="m-0 font-bold">{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                      {selectedRequest.bookkeeping.notes && (
                        <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
                          {selectedRequest.bookkeeping.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedRequest.auditTrail &&
                    selectedRequest.auditTrail.length > 0 && (
                      <div
                        className={`grid gap-3 rounded-lg border p-4 ${
                          isDark
                            ? 'border-[#3c332e] bg-[#181514]'
                            : 'border-[#eadfd4] bg-[#fbf6f0]'
                        }`}
                      >
                        <div>
                          <h3 className="m-0 text-lg font-bold">Audit trail</h3>
                          <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                            Deposit, payment, tip, and status records.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          {[...selectedRequest.auditTrail]
                            .sort(
                              (first, second) =>
                                new Date(second.createdAt).getTime() -
                                new Date(first.createdAt).getTime(),
                            )
                            .map((event) => (
                              <div
                                className={`rounded-lg border p-3 ${
                                  isDark
                                    ? 'border-[#3c332e] bg-[#211d1a]'
                                    : 'border-[#dbd1c5] bg-white'
                                }`}
                                key={event.id}
                              >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="m-0 text-sm font-bold">
                                      {event.label}
                                    </p>
                                    <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
                                      {event.date}
                                      {event.method ? ` / ${event.method}` : ''}
                                      {event.city || event.province
                                        ? ` / ${[event.city, event.province]
                                            .filter(Boolean)
                                            .join(', ')}`
                                        : ''}
                                    </p>
                                  </div>
                                  {event.amount !== undefined && (
                                    <strong className="text-sm">
                                      {formatCurrency(event.amount)}
                                    </strong>
                                  )}
                                </div>
                                {event.notes && (
                                  <p className={`m-0 mt-2 text-sm ${mutedTextClass}`}>
                                    {event.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  <div className="grid gap-2">
                    <h3 className="m-0 text-lg font-bold">Artist notes</h3>
                    <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
                      {selectedRequest.tattoo.placementNotes}
                    </p>
                    {selectedRequest.tattoo.coverupNotes && (
                      <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
                        Coverup: {selectedRequest.tattoo.coverupNotes}
                      </p>
                    )}
                    <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
                      Availability: {selectedRequest.availability}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <h3 className="m-0 text-lg font-bold">Attachments</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ...selectedRequest.photos.referencePhotos,
                        ...selectedRequest.photos.bodyPhotos,
                      ].map((photo) => (
                        <span
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                            isDark
                              ? 'border-[#3c332e] bg-[#181514] text-[#cbbdb3]'
                              : 'border-[#eadfd4] bg-[#fbf6f0] text-[#5a4d46]'
                          }`}
                          key={photo.id}
                        >
                          {photo.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid min-h-[360px] place-items-center text-center">
                  <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                    No request selected.
                  </p>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
