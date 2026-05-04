import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  appendTattooRequestAuditEvent,
  archiveTattooRequest,
  emptyArchivedTattooRequests,
  getAllTattooRequests as getRequests,
  restoreArchivedTattooRequest,
  subscribeToTattooRequests as subscribeToRequests,
  updateTattooRequestAppointment as updateRequestAppointment,
  updateTattooRequestStatus as updateRequestStatus,
} from '../data/tattooRequestStore'
import {
  getAdminTemplates,
  saveAdminTemplates,
  subscribeToAdminTemplates,
} from '../data/adminSettingsStore'
import users from '../data/users.json'
import {
  folderStatuses,
  initialBookingForm,
  initialCompletionForm,
  initialDepositForm,
  statusClass,
  statusLabel,
} from './dashboard/dashboardConstants'
import type {
  AdminTemplates,
  BookingForm,
  CalendarView,
  CompletionForm,
  DepositForm,
  FolderKey,
  RequestStatus,
  TattooRequest,
  TattooRequestBookkeeping,
  TemplateForm,
} from './dashboard/dashboardTypes'
import {
  createAuditEvent,
  formatAppointment,
  formatCurrency,
  formatRequestId,
  formatSubmittedAt,
  getAppointmentStart,
  getBookingFormFromRequest,
  getCompletionFormFromRequest,
  getCalendarRange,
  getDateFromInputValue,
  getDateInputValue,
  getTemplateFormFromTemplates,
  getTemplatesFromTemplateForm,
  isArchived,
  requestMatchesDashboardFilter,
} from './dashboard/dashboardUtils'
import DashboardBookingForm from './dashboard/DashboardBookingForm'
import DashboardCalendarPanel from './dashboard/DashboardCalendarPanel'
import DashboardCompletionForm from './dashboard/DashboardCompletionForm'
import DashboardDepositForm from './dashboard/DashboardDepositForm'
import DashboardQuotePanel from './dashboard/DashboardQuotePanel'
import DashboardRequestDetails from './dashboard/DashboardRequestDetails'
import DashboardRequestHeader from './dashboard/DashboardRequestHeader'
import DashboardRequestList from './dashboard/DashboardRequestList'
import DashboardSettingsView from './dashboard/DashboardSettingsView'
import DashboardSidebar from './dashboard/DashboardSidebar'

type HeaderIconButtonProps = {
  children: ReactNode
  className?: string
  label: string
  onClick?: () => void
  title?: string
}

/** Local square icon button for the dashboard header actions. */
function HeaderIconButton({
  children,
  className = '',
  label,
  onClick,
  title = label,
}: HeaderIconButtonProps) {
  return (
    <button
      className={`grid size-11 place-items-center rounded-lg border transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 focus-visible:ring-offset-2 ${className}`}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title}
    >
      {children}
    </button>
  )
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

  const filteredRequests = useMemo(
    () =>
      artistRequests.filter((request) =>
        requestMatchesDashboardFilter(request, filter, query),
      ),
    [artistRequests, filter, query],
  )

  // Keep the preview scoped to the visible inbox. If a search/folder has no
  // results, the detail pane should be empty instead of showing stale data.
  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedRequestId) ??
    filteredRequests[0] ??
    null

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
  const calendarGridClass =
    calendarView === 'day'
      ? 'grid gap-2'
      : calendarView === 'week'
        ? 'grid gap-2 md:grid-cols-2 2xl:grid-cols-7'
        : 'grid max-h-[420px] gap-2 overflow-auto md:grid-cols-2 lg:grid-cols-3 2xl:max-h-none 2xl:grid-cols-7'
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
    setStatusMessage('Settings saved.')
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
  const compactInputClass = `h-[38px] w-full min-w-0 rounded-lg border bg-transparent px-3 text-sm font-semibold outline-none transition focus:border-[#b95f43] focus:ring-3 focus:ring-[#b95f43]/20 ${
    isDark
      ? 'border-[#3c332e] text-[#fffaf5] placeholder:text-[#8f8178]'
      : 'border-[#c9beb1] text-[#201b18] placeholder:text-[#9a8b81]'
  }`
  const compactTextareaClass = `min-h-[74px] w-full min-w-0 rounded-lg border bg-transparent px-3 py-2 text-sm font-semibold outline-none transition focus:border-[#b95f43] focus:ring-3 focus:ring-[#b95f43]/20 ${
    isDark
      ? 'border-[#3c332e] text-[#fffaf5] placeholder:text-[#8f8178]'
      : 'border-[#c9beb1] text-[#201b18] placeholder:text-[#9a8b81]'
  }`

  if (showSettings) {
    return (
      <main className={shellClass}>
        <DashboardSettingsView
          compactTextareaClass={compactTextareaClass}
          isDark={isDark}
          mutedTextClass={mutedTextClass}
          onBack={() => setShowSettings(false)}
          onSubmit={saveTemplateSettings}
          onTemplateFieldChange={updateTemplateForm}
          panelClass={panelClass}
          statusMessage={statusMessage}
          templateForm={templateForm}
        />
      </main>
    )
  }

  return (
    <main className={shellClass}>
      <div className="grid min-h-screen xl:grid-cols-[260px_minmax(0,1fr)]">
        <DashboardSidebar
          activeFilter={filter}
          artist={artist}
          filters={filters}
          isDark={isDark}
          mutedTextClass={mutedTextClass}
          onEmptyDeleted={emptyDeletedFolder}
          onOpenSettings={() => setShowSettings(true)}
          onSelectFilter={setFilter}
          panelClass={panelClass}
        />

        <section className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
          <header
            className={`border-b px-4 py-4 sm:px-6 xl:px-8 ${
              isDark ? 'border-[#3c332e] bg-[#211d1a]' : 'border-[#dbd1c5] bg-white/75'
            }`}
          >
            <div className="grid gap-4 md:grid-cols-[minmax(190px,1fr)_auto] xl:grid-cols-[minmax(220px,1fr)_minmax(280px,420px)_minmax(140px,1fr)] xl:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#8f4536] font-bold text-white"
                  aria-label="Artist avatar placeholder"
                >
                  {artist?.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div className="min-w-0">
                  <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                    Dashboard
                  </p>
                  <h2 className="m-0 truncate text-2xl leading-tight font-bold">
                    {artist?.name}
                  </h2>
                </div>
              </div>

              <label className="relative block min-w-0 md:col-span-2 xl:col-span-1 xl:justify-self-center xl:w-full">
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

              <div className="flex items-center justify-end gap-3 md:row-start-1 md:col-start-2 xl:col-start-auto xl:row-start-auto xl:justify-self-end">
                <HeaderIconButton
                  className={
                    isDark
                      ? `${panelClass} focus-visible:ring-offset-[#211d1a]`
                      : `${panelClass} focus-visible:ring-offset-white`
                  }
                  label="Open calendar"
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
                </HeaderIconButton>
                <HeaderIconButton
                  className={
                    isDark
                      ? `${panelClass} focus-visible:ring-offset-[#211d1a]`
                      : `${panelClass} focus-visible:ring-offset-white`
                  }
                  onClick={() => setIsDark((current) => !current)}
                  label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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
                </HeaderIconButton>
              </div>
            </div>
            {showCalendar && (
              <div className="mt-4">
                <DashboardCalendarPanel
                  calendarDays={calendarDays}
                  calendarFocusDate={calendarFocusDate}
                  calendarFocusMonth={calendarFocusMonth}
                  calendarGridClass={calendarGridClass}
                  calendarView={calendarView}
                  compactInputClass={compactInputClass}
                  isDark={isDark}
                  mutedTextClass={mutedTextClass}
                  onFocusDateChange={setCalendarFocusDate}
                  onSelectRequest={(requestId) => {
                    setSelectedRequestId(requestId)
                    setShowCalendar(false)
                  }}
                  onViewChange={setCalendarView}
                  scheduledRequests={scheduledRequests}
                />
              </div>
            )}
          </header>

          {/* Keep the dashboard single-column through iPad widths; the dense
             inbox/detail split only appears once there is enough horizontal room. */}
          <div className="grid min-h-0 min-w-0 gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] xl:p-8">
            <section
              className={`grid min-h-0 min-w-0 content-start overflow-hidden rounded-lg border ${panelClass}`}
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

              <DashboardRequestList
                currentFilterLabel={currentFilterLabel}
                formatAppointment={formatAppointment}
                formatRequestId={formatRequestId}
                formatSubmittedAt={formatSubmittedAt}
                isDark={isDark}
                mutedTextClass={mutedTextClass}
                onSelectRequest={selectRequest}
                requests={filteredRequests}
                selectedRequestId={selectedRequest?.id}
                statusClass={statusClass}
                statusLabel={statusLabel}
              />
            </section>

            <section
              className={`grid min-w-0 content-start gap-4 overflow-hidden rounded-lg border p-4 sm:gap-5 sm:p-5 ${panelClass}`}
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
                  <DashboardRequestHeader
                    canAdminister={Boolean(artist?.permissions.includes('adminPanel'))}
                    isDark={isDark}
                    mutedTextClass={mutedTextClass}
                    onChangeStatus={changeSelectedStatus}
                    onDelete={deleteSelectedRequest}
                    onOpenBooking={openBookingForm}
                    onOpenDeposit={openDepositForm}
                    onRestore={restoreSelectedRequest}
                    request={selectedRequest}
                    statusClass={statusClass}
                    statusLabel={statusLabel}
                  />

                  {selectedRequest.status !== 'archived' && (
                    <DashboardQuotePanel
                      compactInputClass={compactInputClass}
                      isDark={isDark}
                      mutedTextClass={mutedTextClass}
                      onMarkQuoted={markQuotedWithTemplate}
                      onSelectedTemplateChange={setSelectedQuoteTemplate}
                      selectedTemplate={selectedQuoteTemplate}
                      templates={templates}
                    />
                  )}

                  {depositRequestId === selectedRequest.id && (
                    <DashboardDepositForm
                      compactInputClass={compactInputClass}
                      compactTextareaClass={compactTextareaClass}
                      form={depositForm}
                      isDark={isDark}
                      mutedTextClass={mutedTextClass}
                      onFieldChange={updateDepositField}
                      onSubmit={confirmDeposit}
                    />
                  )}

                  {bookingRequestId === selectedRequest.id && (
                    <DashboardBookingForm
                      calendarPanel={
                        <DashboardCalendarPanel
                          calendarDays={calendarDays}
                          calendarFocusDate={calendarFocusDate}
                          calendarFocusMonth={calendarFocusMonth}
                          calendarGridClass={calendarGridClass}
                          calendarView={calendarView}
                          compactInputClass={compactInputClass}
                          isBookingPanel
                          isDark={isDark}
                          mutedTextClass={mutedTextClass}
                          onFocusDateChange={setCalendarFocusDate}
                          onSelectRequest={setSelectedRequestId}
                          onViewChange={setCalendarView}
                          scheduledRequests={scheduledRequests}
                        />
                      }
                      compactInputClass={compactInputClass}
                      compactTextareaClass={compactTextareaClass}
                      form={bookingForm}
                      isDark={isDark}
                      mutedTextClass={mutedTextClass}
                      onClearBooking={clearBooking}
                      onFieldChange={updateBookingField}
                      onSubmit={saveBooking}
                      request={selectedRequest}
                      templates={templates}
                    />
                  )}

                  {completionRequestId === selectedRequest.id && (
                    <DashboardCompletionForm
                      compactInputClass={compactInputClass}
                      compactTextareaClass={compactTextareaClass}
                      form={completionForm}
                      isDark={isDark}
                      mutedTextClass={mutedTextClass}
                      onFieldChange={updateCompletionField}
                      onSubmit={saveCompletion}
                    />
                  )}

                  <DashboardRequestDetails
                    formatAppointment={formatAppointment}
                    formatCurrency={formatCurrency}
                    formatSubmittedAt={formatSubmittedAt}
                    isDark={isDark}
                    mutedTextClass={mutedTextClass}
                    request={selectedRequest}
                  />

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
