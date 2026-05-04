import { actionButtonBaseClass, folderStatuses } from './dashboardConstants'
import type { RequestStatus, TattooRequest } from './dashboardTypes'
import { isArchived } from './dashboardUtils'

type DashboardRequestHeaderProps = {
  canAdminister: boolean
  isDark: boolean
  mutedTextClass: string
  onChangeStatus: (status: RequestStatus) => void
  onDelete: () => void
  onOpenBooking: () => void
  onOpenDeposit: () => void
  onRestore: () => void
  request: TattooRequest
  statusClass: Record<RequestStatus, string>
  statusLabel: Record<RequestStatus, string>
}

function StatusBadge({
  className = '',
  status,
  statusClass,
  statusLabel,
}: {
  className?: string
  status: RequestStatus
  statusClass: Record<RequestStatus, string>
  statusLabel: Record<RequestStatus, string>
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClass[status]} ${className}`}
    >
      {statusLabel[status]}
    </span>
  )
}

/** Owns selected-request identity and workflow actions at the top of the detail pane. */
export default function DashboardRequestHeader({
  canAdminister,
  isDark,
  mutedTextClass,
  onChangeStatus,
  onDelete,
  onOpenBooking,
  onOpenDeposit,
  onRestore,
  request,
  statusClass,
  statusLabel,
}: DashboardRequestHeaderProps) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        <p className="m-0 text-xs font-bold tracking-[0.12em] text-[#b95f43] uppercase">
          {isArchived(request) ? 'Deleted request' : 'Selected form'}
        </p>
        <h2 className="m-0 break-words text-2xl leading-tight font-bold sm:text-3xl">
          {request.client.firstName} {request.client.lastName}
        </h2>
        <p className={`m-0 mt-1 break-words text-sm font-semibold ${mutedTextClass}`}>
          {request.client.email} / {request.client.phone}
        </p>
      </div>
      <div className="grid gap-2 xl:justify-items-end">
        <StatusBadge
          className="w-fit px-3"
          statusClass={statusClass}
          statusLabel={statusLabel}
          status={request.status}
        />
        {request.status !== 'archived' && (
          <div
            className="flex max-w-full flex-wrap gap-2 xl:max-w-[360px] xl:justify-end"
            aria-label="Change selected request status"
          >
            {folderStatuses
              .filter((status) => status !== 'archived')
              .map((status) => {
                const isCurrent = request.status === status

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
                    onClick={() => onChangeStatus(status)}
                    aria-pressed={isCurrent}
                  >
                    {statusLabel[status]}
                  </button>
                )
              })}
          </div>
        )}
        {canAdminister && (
          <div className="grid gap-2 sm:flex sm:flex-wrap xl:justify-end">
            {request.status !== 'archived' &&
              request.status !== 'booked' &&
              request.status !== 'completed' && (
              <button
                className={`${actionButtonBaseClass} ${
                  isDark
                    ? 'border-[#3c332e] bg-[#211d1a] text-[#cbbdb3]'
                    : 'border-[#c9beb1] bg-white text-[#5a4d46]'
                }`}
                type="button"
                onClick={onOpenDeposit}
              >
                Confirm deposit
              </button>
            )}
            {request.status !== 'archived' && (
              <button
                className={`${actionButtonBaseClass} ${
                  request.status === 'approved_for_booking' ||
                  request.status === 'booked' ||
                  request.status === 'completed'
                    ? 'border-[#b95f43] bg-[#8f4536] text-white'
                    : isDark
                      ? 'border-[#3c332e] bg-[#211d1a] text-[#8f8178]'
                      : 'border-[#c9beb1] bg-white text-[#9a8b81]'
                }`}
                type="button"
                onClick={onOpenBooking}
              >
                {request.appointment ? 'Edit booking' : 'Book session'}
              </button>
            )}
            {request.status === 'archived' ? (
              <button
                className={`${actionButtonBaseClass} border-[#b95f43] bg-[#8f4536] text-white`}
                type="button"
                onClick={onRestore}
              >
                Restore
              </button>
            ) : (
              <button
                className={`${actionButtonBaseClass} ${
                  isDark
                    ? 'border-[#5b3838] bg-[#2b1d1d] text-[#f0c4c4]'
                    : 'border-[#d8aaaa] bg-[#fff5f5] text-[#743030]'
                }`}
                type="button"
                onClick={onDelete}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
