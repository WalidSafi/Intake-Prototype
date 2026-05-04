import type {
  BookingForm,
  CompletionForm,
  DepositForm,
  FolderKey,
  RequestStatus,
} from './dashboardTypes'

// Capture one stable date for all default forms created during this module load.
const currentDateInputValue = new Date().toISOString().slice(0, 10)

/** Human-facing labels for each request workflow status. */
export const statusLabel: Record<RequestStatus, string> = {
  new: 'Unread',
  needs_review: 'Needs review',
  quoted: 'Quoted',
  approved_for_booking: 'Ready to book',
  completed: 'Completed',
  archived: 'Deleted',
}

/** Badge color classes keyed by request status. */
export const statusClass: Record<RequestStatus, string> = {
  new: 'border-[#d76749] bg-[#fff1eb] text-[#8f3524]',
  needs_review: 'border-[#c6a13f] bg-[#fff7d8] text-[#6d5413]',
  quoted: 'border-[#6ba978] bg-[#eef8f0] text-[#276037]',
  approved_for_booking: 'border-[#638ab7] bg-[#edf4ff] text-[#2c547f]',
  completed: 'border-[#8d7a6c] bg-[#f4eee8] text-[#5a4d46]',
  archived: 'border-[#aa5757] bg-[#fff0f0] text-[#743030]',
}

/** Sidebar folder order. This controls the main workflow progression. */
export const folderStatuses: FolderKey[] = [
  'new',
  'needs_review',
  'quoted',
  'approved_for_booking',
  'completed',
  'archived',
]

/** Shared sizing and focus treatment for detail-pane action buttons. */
export const actionButtonBaseClass =
  'min-h-[38px] w-full rounded-lg border px-3 text-xs font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 sm:w-fit'

/** Defaults used when opening the completed/payment workflow for the first time. */
export const initialCompletionForm: CompletionForm = {
  paymentAmount: '',
  paymentDate: currentDateInputValue,
  paymentMethod: 'Card',
  paymentCity: 'Toronto',
  paymentProvince: 'ON',
  sessionCount: '1',
  tipAmount: '',
  category: 'Tattoo service',
  notes: '',
}

/** Defaults used when confirming a deposit for a request. */
export const initialDepositForm: DepositForm = {
  amount: '',
  date: currentDateInputValue,
  method: 'Card',
  city: 'Toronto',
  province: 'ON',
  notes: '',
}

/** Defaults used when creating a new appointment from the dashboard. */
export const initialBookingForm: BookingForm = {
  date: currentDateInputValue,
  startTime: '10:00',
  durationMinutes: '120',
  service: 'Tattoo session',
  depositReceived: true,
  notes: '',
}
