import type { FormEvent, ReactNode } from 'react'
import { bookingServiceOptions } from './dashboardConstants'
import type { BookingForm, TattooRequest } from './dashboardTypes'

type DashboardBookingFormProps = {
  calendarPanel: ReactNode
  compactInputClass: string
  compactTextareaClass: string
  form: BookingForm
  isDark: boolean
  mutedTextClass: string
  onClearBooking: () => void
  onFieldChange: <Field extends keyof BookingForm>(
    field: Field,
    value: BookingForm[Field],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  request: TattooRequest
}

/** Renders admin booking controls and receives the shared calendar as a child boundary. */
export default function DashboardBookingForm({
  calendarPanel,
  compactInputClass,
  compactTextareaClass,
  form,
  isDark,
  mutedTextClass,
  onClearBooking,
  onFieldChange,
  onSubmit,
  request,
}: DashboardBookingFormProps) {
  return (
    <form
      className={`grid gap-4 rounded-lg border p-4 ${
        isDark ? 'border-[#4a382f] bg-[#1b1715]' : 'border-[#dfc8ba] bg-[#fff8f3]'
      }`}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="m-0 text-base font-bold">Admin booking</h3>
          <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
            {request.status === 'completed'
              ? 'Schedule touch-ups or healed-work check-ins.'
              : 'Deposit received clients can be placed on the schedule.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {request.appointment && (
            <button
              className={`min-h-[34px] rounded-lg border px-3 text-xs font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                isDark
                  ? 'border-[#3c332e] bg-[#211d1a] text-[#cbbdb3]'
                  : 'border-[#c9beb1] bg-white text-[#5a4d46]'
              }`}
              type="button"
              onClick={onClearBooking}
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

      {calendarPanel}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1 text-xs font-bold uppercase">
          Date
          <input
            className={compactInputClass}
            type="date"
            required
            value={form.date}
            onChange={(event) => onFieldChange('date', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase">
          Start
          <input
            className={compactInputClass}
            type="time"
            required
            value={form.startTime}
            onChange={(event) => onFieldChange('startTime', event.target.value)}
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
            value={form.durationMinutes}
            onChange={(event) =>
              onFieldChange('durationMinutes', event.target.value)
            }
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase">
          Service
          <select
            className={compactInputClass}
            value={form.service}
            onChange={(event) => onFieldChange('service', event.target.value)}
          >
            {bookingServiceOptions.map((template) => (
              <option key={template}>{template}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs font-bold uppercase">
        <input
          className="size-4 accent-[#8f4536]"
          type="checkbox"
          checked={form.depositReceived}
          onChange={(event) => onFieldChange('depositReceived', event.target.checked)}
        />
        Deposit received
      </label>

      <label className="grid gap-1 text-xs font-bold uppercase">
        Booking notes
        <textarea
          className={compactTextareaClass}
          value={form.notes}
          onChange={(event) => onFieldChange('notes', event.target.value)}
          placeholder="Prep notes, stencil timing, touch-up area, supplies..."
        />
      </label>
    </form>
  )
}
