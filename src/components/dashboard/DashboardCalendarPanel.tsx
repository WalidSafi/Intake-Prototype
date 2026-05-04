import type { CalendarView, TattooRequest } from './dashboardTypes'
import {
  formatCalendarDay,
  formatCalendarTitle,
  getDateFromInputValue,
} from './dashboardUtils'

type DashboardCalendarPanelProps = {
  calendarDays: string[]
  calendarFocusDate: string
  calendarFocusMonth: number
  calendarGridClass: string
  calendarView: CalendarView
  compactInputClass: string
  isBookingPanel?: boolean
  isDark: boolean
  mutedTextClass: string
  onFocusDateChange: (value: string) => void
  onSelectRequest: (requestId: string) => void
  onViewChange: (view: CalendarView) => void
  scheduledRequests: TattooRequest[]
}

/** Renders the shared dashboard calendar used by the header and booking flow. */
export default function DashboardCalendarPanel({
  calendarDays,
  calendarFocusDate,
  calendarFocusMonth,
  calendarGridClass,
  calendarView,
  compactInputClass,
  isBookingPanel = false,
  isDark,
  mutedTextClass,
  onFocusDateChange,
  onSelectRequest,
  onViewChange,
  scheduledRequests,
}: DashboardCalendarPanelProps) {
  return (
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
        <div className="grid gap-2 sm:grid-cols-[minmax(150px,1fr)_auto_auto_auto] xl:flex xl:flex-wrap xl:items-center">
          <input
            className={compactInputClass}
            type="date"
            value={calendarFocusDate}
            onChange={(event) => onFocusDateChange(event.target.value)}
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
                onClick={() => onViewChange(view)}
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
              className={`min-h-[92px] rounded-lg border p-2 sm:min-h-[112px] xl:min-h-[132px] ${
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
                    onClick={() => onSelectRequest(request.id)}
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
}
