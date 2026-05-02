import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  getAllTattooRequests as getRequests,
  subscribeToTattooRequests as subscribeToRequests,
  updateTattooRequestStatus as updateRequestStatus,
  type TattooRequest,
  type TattooRequestBookkeeping,
  type TattooRequestStatus as RequestStatus,
} from '../data/tattooRequestStore'
import users from '../data/users.json'

type FilterKey = 'all' | 'ongoing' | 'archive' | 'unread'
type CompletionForm = {
  paymentAmount: string
  paymentDate: string
  paymentMethod: string
  sessionCount: string
  tipAmount: string
  category: string
  notes: string
}

const statusLabel: Record<string, string> = {
  new: 'Unread',
  needs_review: 'Needs review',
  quoted: 'Quoted',
  approved_for_booking: 'Ready to book',
  completed: 'Completed',
  archived: 'Archived',
}

const statusClass: Record<string, string> = {
  new: 'border-[#d76749] bg-[#fff1eb] text-[#8f3524]',
  needs_review: 'border-[#c6a13f] bg-[#fff7d8] text-[#6d5413]',
  quoted: 'border-[#6ba978] bg-[#eef8f0] text-[#276037]',
  approved_for_booking: 'border-[#638ab7] bg-[#edf4ff] text-[#2c547f]',
  completed: 'border-[#8d7a6c] bg-[#f4eee8] text-[#5a4d46]',
  archived: 'border-[#8d7a6c] bg-[#f4eee8] text-[#5a4d46]',
}

const activeStatuses: RequestStatus[] = [
  'new',
  'needs_review',
  'quoted',
  'approved_for_booking',
  'completed',
]

const initialCompletionForm: CompletionForm = {
  paymentAmount: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'Card',
  sessionCount: '1',
  tipAmount: '',
  category: 'Tattoo service',
  notes: '',
}

function isArchived(request: TattooRequest) {
  return request.status === 'completed' || request.status === 'archived'
}

function isOngoing(request: TattooRequest) {
  return !isArchived(request)
}

function isInProgress(request: TattooRequest) {
  return !isArchived(request) && request.status !== 'new'
}

function isUnread(request: TattooRequest) {
  return request.status === 'new'
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
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

export default function AdminDashboard() {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [requestRecords, setRequestRecords] = useState<TattooRequest[]>(getRequests)
  const [completionRequestId, setCompletionRequestId] = useState<string | null>(null)
  const [completionForm, setCompletionForm] = useState<CompletionForm>(
    initialCompletionForm,
  )
  const [statusMessage, setStatusMessage] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  const artist = users.find((user) => user.permissions.includes('adminPanel'))

  useEffect(
    () => subscribeToRequests(() => setRequestRecords(getRequests())),
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
      const matchesFilter =
        (filter === 'all' && isOngoing(request)) ||
        (filter === 'ongoing' && isInProgress(request)) ||
        (filter === 'archive' && isArchived(request)) ||
        (filter === 'unread' && isUnread(request) && isOngoing(request))

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
        request.bookkeeping?.paymentMethod ?? '',
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
    filteredRequests[0] ??
    artistRequests.find((request) => request.id === selectedRequestId) ??
    artistRequests[0]

  const filters: Array<{
    key: FilterKey
    label: string
    count: number
  }> = [
    {
      key: 'all',
      label: 'Active inbox',
      count: artistRequests.filter(isOngoing).length,
    },
    {
      key: 'ongoing',
      label: 'In progress',
      count: artistRequests.filter(isInProgress).length,
    },
    {
      key: 'archive',
      label: 'Completed',
      count: artistRequests.filter(isArchived).length,
    },
    {
      key: 'unread',
      label: 'Unread',
      count: artistRequests.filter((request) => isUnread(request) && isOngoing(request))
        .length,
    },
  ]

  const currentFilterLabel =
    filters.find((item) => item.key === filter)?.label ?? 'Requests'

  const activeFilters = filters.filter((item) => item.key !== 'archive')
  const completedFilter = filters.find((item) => item.key === 'archive')

  const changeSelectedStatus = (status: RequestStatus) => {
    if (!selectedRequest) {
      return
    }

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

  const updateCompletionField = <Field extends keyof CompletionForm>(
    field: Field,
    value: CompletionForm[Field],
  ) => {
    setCompletionForm((current) => ({ ...current, [field]: value }))
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
      sessionCount,
      tipAmount,
      category: completionForm.category.trim(),
      notes: completionForm.notes.trim(),
    }

    updateRequestStatus(selectedRequest.id, 'completed', {
      completedAt: new Date(`${completionForm.paymentDate}T12:00:00`).toISOString(),
      bookkeeping,
    })
    setStatusMessage(`Completed ${formatRequestId(selectedRequest.id)} and saved bookkeeping.`)
    setCompletionRequestId(null)
  }

  const upcomingRequests = artistRequests
    .filter((request) => !isArchived(request))
    .slice(0, 4)

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

  return (
    <main className={shellClass}>
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={`border-b px-4 py-5 lg:border-b-0 lg:border-r lg:px-5 ${
            isDark ? 'border-[#3c332e] bg-[#171311]' : 'border-[#dbd1c5] bg-white'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <a
              className="text-sm font-bold text-[#b95f43] underline-offset-4 hover:underline"
              href="#"
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

          <nav className="mt-8 grid gap-2" aria-label="Request filters">
            {activeFilters.map((item) => {
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
            {completedFilter && (
              <div className="mt-4 border-t border-inherit pt-4">
                <button
                  className={`flex min-h-[46px] w-full items-center justify-between rounded-lg border px-3 text-left text-sm font-bold transition ${
                    filter === completedFilter.key
                      ? 'border-[#b95f43] bg-[#8f4536] text-white'
                      : `${panelClass} ${mutedTextClass} hover:border-[#b95f43]`
                  }`}
                  type="button"
                  onClick={() => setFilter(completedFilter.key)}
                >
                  <span>{completedFilter.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      filter === completedFilter.key
                        ? 'bg-white/20 text-white'
                        : isDark
                          ? 'bg-[#302925] text-[#f3d6ca]'
                          : 'bg-[#f1e5da] text-[#7a4638]'
                    }`}
                  >
                    {completedFilter.count}
                  </span>
                </button>
              </div>
            )}
          </nav>
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
            {showCalendar && (
              <div
                className={`mt-4 grid gap-3 rounded-lg border p-4 ${
                  isDark
                    ? 'border-[#3c332e] bg-[#181514]'
                    : 'border-[#eadfd4] bg-[#fbf6f0]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="m-0 text-sm font-bold">Upcoming queue</h3>
                  <span className={`text-xs font-bold ${mutedTextClass}`}>
                    Prototype calendar
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {upcomingRequests.map((request) => (
                    <button
                      className={`rounded-lg border p-3 text-left transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                        isDark
                          ? 'border-[#3c332e] bg-[#211d1a]'
                          : 'border-[#dbd1c5] bg-white'
                      }`}
                      key={request.id}
                      type="button"
                      onClick={() => {
                        setSelectedRequestId(request.id)
                        setShowCalendar(false)
                      }}
                    >
                      <p className="m-0 text-xs font-bold text-[#b95f43]">
                        {formatSubmittedAt(request.submittedAt)}
                      </p>
                      <p className="m-0 mt-1 font-bold">
                        {request.client.firstName} {request.client.lastName}
                      </p>
                      <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
                        {request.tattoo.placement} / {request.tattoo.style}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </header>

          <div className="grid min-h-0 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)] lg:p-8">
            <section
              className={`grid min-h-0 content-start overflow-hidden rounded-lg border ${panelClass}`}
              aria-labelledby="inbox-heading"
            >
              <div className="flex items-center justify-between gap-3 border-b border-inherit px-4 py-3">
                <div>
                  <p className="m-0 text-xs font-bold tracking-[0.12em] text-[#b95f43] uppercase">
                    Newest first
                  </p>
                  <h2 className="m-0 text-xl font-bold" id="inbox-heading">
                    {filter === 'archive' ? 'Completed' : 'Intake inbox'}
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
                      onClick={() => setSelectedRequestId(request.id)}
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
                                Completed
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
                          ? 'Completed artwork'
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
                      <div
                        className="flex max-w-[360px] flex-wrap gap-2 xl:justify-end"
                        aria-label="Change selected request status"
                      >
                        {activeStatuses.map((status) => {
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
                    </div>
                  </div>

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
