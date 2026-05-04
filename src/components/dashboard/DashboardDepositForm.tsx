import type { FormEvent } from 'react'
import type { DepositForm } from './dashboardTypes'

type DashboardDepositFormProps = {
  compactInputClass: string
  compactTextareaClass: string
  form: DepositForm
  isDark: boolean
  mutedTextClass: string
  onFieldChange: <Field extends keyof DepositForm>(
    field: Field,
    value: DepositForm[Field],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/** Captures deposit receipt details while leaving validation and persistence to the dashboard owner. */
export default function DashboardDepositForm({
  compactInputClass,
  compactTextareaClass,
  form,
  isDark,
  mutedTextClass,
  onFieldChange,
  onSubmit,
}: DashboardDepositFormProps) {
  return (
    <form
      className={`grid gap-4 rounded-lg border p-4 ${
        isDark ? 'border-[#4a382f] bg-[#1b1715]' : 'border-[#dfc8ba] bg-[#fff8f3]'
      }`}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="m-0 text-base font-bold">Deposit received</h3>
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
            value={form.amount}
            onChange={(event) => onFieldChange('amount', event.target.value)}
            placeholder="100.00"
          />
        </label>
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
          Method
          <select
            className={compactInputClass}
            value={form.method}
            onChange={(event) => onFieldChange('method', event.target.value)}
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
            value={form.city}
            onChange={(event) => onFieldChange('city', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase">
          Province
          <input
            className={compactInputClass}
            required
            value={form.province}
            onChange={(event) => onFieldChange('province', event.target.value)}
          />
        </label>
      </div>

      <label className="grid gap-1 text-xs font-bold uppercase">
        Deposit notes
        <textarea
          className={compactTextareaClass}
          value={form.notes}
          onChange={(event) => onFieldChange('notes', event.target.value)}
          placeholder="Receipt, transfer reference, tax note..."
        />
      </label>
    </form>
  )
}
