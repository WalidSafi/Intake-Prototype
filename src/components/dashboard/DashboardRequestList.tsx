import type {
  TattooRequest,
  TattooRequestStatus as RequestStatus,
} from '../../data/tattooRequestStore'

type DashboardRequestListProps = {
  currentFilterLabel: string
  formatAppointment: (appointment: NonNullable<TattooRequest['appointment']>) => string
  formatRequestId: (id: string) => string
  formatSubmittedAt: (value: string) => string
  isDark: boolean
  mutedTextClass: string
  onSelectRequest: (request: TattooRequest) => void
  requests: TattooRequest[]
  selectedRequestId?: string
  statusClass: Record<RequestStatus, string>
  statusLabel: Record<RequestStatus, string>
}

function StatusBadge({
  status,
  statusClass,
  statusLabel,
}: {
  status: RequestStatus
  statusClass: Record<RequestStatus, string>
  statusLabel: Record<RequestStatus, string>
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  )
}

/** Renders the filtered inbox cards and empty state for the active folder/search. */
export default function DashboardRequestList({
  currentFilterLabel,
  formatAppointment,
  formatRequestId,
  formatSubmittedAt,
  isDark,
  mutedTextClass,
  onSelectRequest,
  requests,
  selectedRequestId,
  statusClass,
  statusLabel,
}: DashboardRequestListProps) {
  return (
    <div className="grid max-h-[48vh] overflow-auto sm:max-h-[520px] xl:max-h-[680px]">
      {requests.map((request) => {
        const selected = selectedRequestId === request.id

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
            onClick={() => onSelectRequest(request)}
            aria-pressed={selected}
            aria-label={`Show intake details for ${request.client.firstName} ${request.client.lastName}`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {request.status === 'new' && (
                    <span className="size-2 rounded-full bg-[#d76749]" />
                  )}
                  {request.status === 'archived' && (
                    <span className="rounded-full bg-[#f1e5da] px-2 py-0.5 text-[0.68rem] font-bold tracking-[0.08em] text-[#7a4638] uppercase">
                      Deleted
                    </span>
                  )}
                  <h3 className="m-0 truncate text-lg font-bold">
                    {request.client.firstName} {request.client.lastName}
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
              {/* Keep request metadata compact so cards remain scannable in long inboxes. */}
              <StatusBadge
                status={request.status}
                statusClass={statusClass}
                statusLabel={statusLabel}
              />
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
                {request.photos.referencePhotos.length + request.photos.bodyPhotos.length}{' '}
                photos
              </span>
            </div>
          </button>
        )
      })}

      {requests.length === 0 && (
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
  )
}
