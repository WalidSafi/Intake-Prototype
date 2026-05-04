import type { TattooRequest, TattooRequestAppointment } from './dashboardTypes'

type DashboardRequestDetailsProps = {
  formatAppointment: (appointment: TattooRequestAppointment) => string
  formatCurrency: (value: number) => string
  formatSubmittedAt: (value: string) => string
  isDark: boolean
  mutedTextClass: string
  request: TattooRequest
}

/** Renders the read-only intake, booking, bookkeeping, and audit details. */
export default function DashboardRequestDetails({
  formatAppointment,
  formatCurrency,
  formatSubmittedAt,
  isDark,
  mutedTextClass,
  request,
}: DashboardRequestDetailsProps) {
  const insetPanelClass = isDark
    ? 'border-[#3c332e] bg-[#181514]'
    : 'border-[#eadfd4] bg-[#fbf6f0]'

  return (
    <>
      <div className={`rounded-lg border p-4 ${insetPanelClass}`}>
        <p className="m-0 text-lg leading-relaxed">
          {request.tattoo.description}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        {getRequestDetailItems(request, formatAppointment, formatSubmittedAt).map(
          (item) => (
            <div className={`rounded-lg border p-3 ${insetPanelClass}`} key={item.label}>
              <dt className={`text-xs font-bold uppercase ${mutedTextClass}`}>
                {item.label}
              </dt>
              <dd className="m-0 mt-1 font-bold">{item.value}</dd>
            </div>
          ),
        )}
      </dl>

      {request.appointment && (
        <div className={`grid gap-2 rounded-lg border p-4 ${insetPanelClass}`}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="m-0 text-lg font-bold">Booking</h3>
              <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                {request.appointment.service}
              </p>
            </div>
            <span className="font-bold">{formatAppointment(request.appointment)}</span>
          </div>
          <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
            {request.appointment.depositReceived
              ? 'Deposit received'
              : 'No deposit marked'}
            {' / '}
            {request.appointment.durationMinutes} minutes
          </p>
          {request.appointment.notes && (
            <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
              {request.appointment.notes}
            </p>
          )}
        </div>
      )}

      {request.bookkeeping && (
        <div className={`grid gap-3 rounded-lg border p-4 ${insetPanelClass}`}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="m-0 text-lg font-bold">Bookkeeping</h3>
              <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
                {request.bookkeeping.category}
              </p>
            </div>
            <strong className="text-xl">
              {formatCurrency(
                request.bookkeeping.paymentAmount +
                  (request.bookkeeping.tipAmount ?? 0),
              )}
            </strong>
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            {getBookkeepingItems(request, formatCurrency).map((item) => (
              <div key={item.label}>
                <dt className={`text-xs font-bold uppercase ${mutedTextClass}`}>
                  {item.label}
                </dt>
                <dd className="m-0 font-bold">{item.value}</dd>
              </div>
            ))}
          </dl>
          {request.bookkeeping.notes && (
            <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
              {request.bookkeeping.notes}
            </p>
          )}
        </div>
      )}

      {request.auditTrail && request.auditTrail.length > 0 && (
        <div className={`grid gap-3 rounded-lg border p-4 ${insetPanelClass}`}>
          <div>
            <h3 className="m-0 text-lg font-bold">Audit trail</h3>
            <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
              Deposit, payment, tip, and status records.
            </p>
          </div>
          <div className="grid gap-2">
            {[...request.auditTrail]
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
                      <p className="m-0 text-sm font-bold">{event.label}</p>
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
    </>
  )
}

/** Builds the core intake facts shown under the selected request. */
function getRequestDetailItems(
  request: TattooRequest,
  formatAppointment: DashboardRequestDetailsProps['formatAppointment'],
  formatSubmittedAt: DashboardRequestDetailsProps['formatSubmittedAt'],
) {
  return [
    {
      label: 'Placement',
      value: request.tattoo.placement,
    },
    {
      label: 'Size',
      value: `${request.tattoo.size.width} x ${request.tattoo.size.height} ${request.tattoo.size.unit}`,
    },
    { label: 'Style', value: request.tattoo.style },
    {
      label: 'Color',
      value: request.tattoo.colorMode,
    },
    { label: 'Budget', value: request.budget },
    {
      label: 'Booking location',
      value: request.bookingLocation || 'Not set',
    },
    {
      label: 'Travel date',
      value: request.travelDate || 'Not selected',
    },
    {
      label: 'Submitted',
      value: formatSubmittedAt(request.submittedAt),
    },
    ...(request.appointment
      ? [
          {
            label: 'Booked',
            value: formatAppointment(request.appointment),
          },
          {
            label: 'Booking type',
            value: `${request.appointment.service} / ${request.appointment.durationMinutes} min`,
          },
        ]
      : []),
    ...(request.completedAt
      ? [
          {
            label: 'Completed',
            value: formatSubmittedAt(request.completedAt),
          },
        ]
      : []),
  ]
}

/** Builds bookkeeping rows while keeping total formatting out of the page shell. */
function getBookkeepingItems(
  request: TattooRequest,
  formatCurrency: DashboardRequestDetailsProps['formatCurrency'],
) {
  if (!request.bookkeeping) {
    return []
  }

  return [
    {
      label: 'Payment',
      value: formatCurrency(request.bookkeeping.paymentAmount),
    },
    {
      label: 'Tip',
      value: formatCurrency(request.bookkeeping.tipAmount ?? 0),
    },
    {
      label: 'Payment date',
      value: request.bookkeeping.paymentDate,
    },
    {
      label: 'Method',
      value: request.bookkeeping.paymentMethod,
    },
    {
      label: 'Received in',
      value: [
        request.bookkeeping.paymentCity,
        request.bookkeeping.paymentProvince,
      ]
        .filter(Boolean)
        .join(', '),
    },
    {
      label: 'Sessions',
      value: `${request.bookkeeping.sessionCount}`,
    },
  ]
}
