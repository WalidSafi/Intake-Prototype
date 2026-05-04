import type { FormEvent } from 'react'
import type { CompletionForm } from './dashboardTypes'

type DashboardCompletionFormProps = {
  compactInputClass: string
  compactTextareaClass: string
  form: CompletionForm
  isDark: boolean
  mutedTextClass: string
  onFieldChange: <Field extends keyof CompletionForm>(
    field: Field,
    value: CompletionForm[Field],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/** Captures completion bookkeeping fields while the dashboard keeps save semantics. */
export default function DashboardCompletionForm({
  compactInputClass,
  compactTextareaClass,
  form,
  isDark,
  mutedTextClass,
  onFieldChange,
  onSubmit,
}: DashboardCompletionFormProps) {
  return (
    <form
      className={`grid gap-4 rounded-lg border p-4 ${
        isDark ? 'border-[#4a382f] bg-[#1b1715]' : 'border-[#dfc8ba] bg-[#fff8f3]'
      }`}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="m-0 text-base font-bold">Complete work</h3>
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
            value={form.paymentAmount}
            onChange={(event) => onFieldChange('paymentAmount', event.target.value)}
            placeholder="450.00"
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase">
          Payment date
          <input
            className={compactInputClass}
            type="date"
            required
            value={form.paymentDate}
            onChange={(event) => onFieldChange('paymentDate', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase">
          Method
          <select
            className={compactInputClass}
            value={form.paymentMethod}
            onChange={(event) => onFieldChange('paymentMethod', event.target.value)}
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
            value={form.sessionCount}
            onChange={(event) => onFieldChange('sessionCount', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase">
          City
          <input
            className={compactInputClass}
            required
            value={form.paymentCity}
            onChange={(event) => onFieldChange('paymentCity', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase">
          Province
          <input
            className={compactInputClass}
            required
            value={form.paymentProvince}
            onChange={(event) => onFieldChange('paymentProvince', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase">
          Tip
          <input
            className={compactInputClass}
            type="number"
            min="0"
            step="0.01"
            value={form.tipAmount}
            onChange={(event) => onFieldChange('tipAmount', event.target.value)}
            placeholder="0.00"
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase">
          Category
          <input
            className={compactInputClass}
            required
            value={form.category}
            onChange={(event) => onFieldChange('category', event.target.value)}
            placeholder="Tattoo service"
          />
        </label>
      </div>

      <label className="grid gap-1 text-xs font-bold uppercase">
        Bookkeeping notes
        <textarea
          className={compactTextareaClass}
          value={form.notes}
          onChange={(event) => onFieldChange('notes', event.target.value)}
          placeholder="Receipt notes, tax category, supplies, deposit details..."
        />
      </label>
    </form>
  )
}
