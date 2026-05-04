import type { AdminTemplates } from '../../data/adminSettingsStore'
import type {
  TattooRequest,
  TattooRequestAppointment,
  TattooRequestAuditEvent,
  TattooRequestBookkeeping,
  TattooRequestStatus as RequestStatus,
} from '../../data/tattooRequestStore'

export type {
  AdminTemplates,
  RequestStatus,
  TattooRequest,
  TattooRequestAppointment,
  TattooRequestAuditEvent,
  TattooRequestBookkeeping,
}

/** Dashboard folders map directly to request statuses in the prototype store. */
export type FolderKey = RequestStatus

/** Calendar density modes available from the dashboard and booking panel. */
export type CalendarView = 'day' | 'week' | 'month'

/** Controlled form state for marking a request completed and paid. */
export type CompletionForm = {
  paymentAmount: string
  paymentDate: string
  paymentMethod: string
  paymentCity: string
  paymentProvince: string
  sessionCount: string
  tipAmount: string
  category: string
  notes: string
}

/** Controlled form state for recording the deposit that unlocks booking. */
export type DepositForm = {
  amount: string
  date: string
  method: string
  city: string
  province: string
  notes: string
}

/** Controlled form state for creating or editing an appointment. */
export type BookingForm = {
  date: string
  startTime: string
  durationMinutes: string
  service: string
  depositReceived: boolean
  notes: string
}

/** Settings form state mirrors saved templates as newline-delimited text. */
export type TemplateForm = {
  quoteTemplates: string
  sessionTemplates: string
}

/** Derived sidebar filter data with the current count for each folder. */
export type DashboardFilter = {
  key: FolderKey
  label: string
  count: number
}
