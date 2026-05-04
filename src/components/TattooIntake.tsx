import { type FormEvent, useEffect, useMemo, useState } from 'react'
import heroImg from '../assets/hero.png'
import {
  getAdminTemplates,
  subscribeToAdminTemplates,
  type BookingLocation,
  type AdminTemplates,
} from '../data/adminSettingsStore'
import {
  appendTattooRequest,
  type NewTattooRequestInput,
  type TattooRequestPhoto,
} from '../data/tattooRequestStore'

type TattooIntakeForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  tattooDescription: string
  width: string
  height: string
  unit: 'in' | 'cm'
  placement: string
  placementNotes: string
  colorMode: string
  style: string
  isCoverup: string
  coverupNotes: string
  referencePhotos: FileList | null
  bodyPhotos: FileList | null
  budget: string
  availability: string
  bookingLocation: string
  travelDate: string
  consent: boolean
}

const initialForm: TattooIntakeForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  tattooDescription: '',
  width: '',
  height: '',
  unit: 'in',
  placement: '',
  placementNotes: '',
  colorMode: 'Black and grey',
  style: 'Not sure yet',
  isCoverup: 'No',
  coverupNotes: '',
  referencePhotos: null,
  bodyPhotos: null,
  budget: '',
  availability: '',
  bookingLocation: '',
  travelDate: '',
  consent: false,
}

const requiredFields: Array<keyof TattooIntakeForm> = [
  'firstName',
  'email',
  'tattooDescription',
  'width',
  'height',
  'placement',
  'bookingLocation',
]

const placements = [
  'Arm',
  'Forearm',
  'Wrist',
  'Hand',
  'Leg',
  'Thigh',
  'Calf',
  'Chest',
  'Back',
  'Ribs',
  'Neck',
  'Flexible',
  'Unknown',
  'Other',
]

const colorModes = ['Black and grey', 'Color', 'Blackwork', 'Not sure yet']

const budgets = [
  'I need guidance',
  'Under $250',
  '$250 - $500',
  '$500 - $1,000',
  '$1,000 - $2,000',
  '$2,000+',
]

const inputClass =
  'h-[46px] w-full min-w-0 rounded-lg border border-[#c9beb1] bg-white px-3.5 text-base text-[#201b18] outline-none transition focus:border-[#8f4536] focus:ring-3 focus:ring-[#8f4536]/15'

const textareaClass =
  'w-full min-w-0 resize-y rounded-lg border border-[#c9beb1] bg-white px-3.5 py-3 text-base leading-relaxed text-[#201b18] outline-none transition focus:border-[#8f4536] focus:ring-3 focus:ring-[#8f4536]/15'

const labelClass = 'grid min-w-0 gap-2 text-sm font-bold text-[#5a4d46]'
const sectionClass =
  'grid w-full max-w-[940px] gap-6 border-b border-[#dbd1c5] pb-7'
const choiceClass =
  'grid min-h-[42px] place-items-center rounded-lg border border-[#c9beb1] bg-white px-3 text-center text-[#201b18] transition peer-checked:border-[#8f4536] peer-checked:bg-[#f5ddd2] peer-checked:text-[#5b2117] peer-focus-visible:ring-3 peer-focus-visible:ring-[#8f4536]/25 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#f7f0e8]'

const stepHeaderClass = 'flex items-baseline gap-3'
const stepNumberClass =
  'm-0 text-xs font-bold tracking-[0.12em] text-[#8f4536] uppercase'
const stepTitleClass =
  'm-0 text-[1.45rem] leading-tight font-bold text-[#201b18]'
const metaClass =
  'rounded-full bg-[#f1e5da] px-2 py-0.5 text-[0.68rem] font-bold tracking-[0.08em] text-[#7a4638] uppercase'
const uploadBoxClass =
  'grid min-h-[118px] cursor-pointer content-center gap-2 rounded-lg border border-dashed border-[#c9beb1] bg-white px-4 py-4 text-[#201b18] transition peer-focus-visible:ring-3 peer-focus-visible:ring-[#8f4536]/25 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#f7f0e8] sm:min-h-[136px]'

function isPositiveNumeric(value: string) {
  return Number.isFinite(Number(value)) && Number(value) > 0
}

function fileCount(files: FileList | null) {
  if (!files?.length) {
    return 'No photos selected'
  }

  return `${files.length} photo${files.length === 1 ? '' : 's'} selected`
}

function formatRequestId(id: string) {
  return id ? id.replace('req_2026_', '#') : ''
}

function createPhotoPlaceholders(
  files: FileList | null,
  prefix: 'reference' | 'body',
  uploadId: string,
) {
  if (!files?.length) {
    return []
  }

  return Array.from(files).map<TattooRequestPhoto>((file, index) => {
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')

    return {
      id: `${uploadId}_${prefix}_${index + 1}`,
      label: file.name,
      url: `/prototype-uploads/${uploadId}-${prefix}-${safeName}`,
    }
  })
}

function FieldText({
  children,
  required = false,
}: {
  children: string
  required?: boolean
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>{children}</span>
      <span className={metaClass}>{required ? 'Required' : 'Optional'}</span>
    </span>
  )
}

function FileUploadText({
  title,
  files,
}: {
  title: string
  files: FileList | null
}) {
  return (
    <span className={uploadBoxClass}>
      <span className="text-sm font-bold text-[#5b2117]">{title}</span>
      <span className="text-sm font-semibold text-[#7a6a60]">
        Tap to choose images
      </span>
      <span className="text-xs font-bold text-[#8f4536]">
        {fileCount(files)}
      </span>
    </span>
  )
}

export default function TattooIntake() {
  const [form, setForm] = useState<TattooIntakeForm>(initialForm)
  const [settings, setSettings] = useState<AdminTemplates>(getAdminTemplates)
  const [submitted, setSubmitted] = useState(false)
  const [submittedRequestId, setSubmittedRequestId] = useState('')

  useEffect(() => {
    return subscribeToAdminTemplates(() => {
      setSettings(getAdminTemplates())
    })
  }, [])

  const completion = useMemo(() => {
    const completed = requiredFields.filter((field) => {
      const value = form[field]
      if (field === 'width' || field === 'height') {
        return typeof value === 'string' && isPositiveNumeric(value)
      }
      return typeof value === 'string' && value.trim().length > 0
    }).length

    return Math.round((completed / requiredFields.length) * 100)
  }, [form])

  const selectedBookingLocation = settings.bookingLocations.find(
    (location) => location.city === form.bookingLocation,
  )

  const updateField = <Field extends keyof TattooIntakeForm>(
    field: Field,
    value: TattooIntakeForm[Field],
  ) => {
    setSubmitted(false)
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitted) {
      return
    }

    const uploadId = `intake_${Date.now()}`
    const request: NewTattooRequestInput = {
      client: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      tattoo: {
        description: form.tattooDescription.trim(),
        size: {
          width: Number(form.width),
          height: Number(form.height),
          unit: form.unit,
        },
        placement: form.placement,
        placementNotes: form.placementNotes.trim(),
        colorMode: form.colorMode,
        style: form.style,
        isCoverup: form.isCoverup,
        coverupNotes: form.coverupNotes.trim(),
      },
      photos: {
        referencePhotos: createPhotoPlaceholders(
          form.referencePhotos,
          'reference',
          uploadId,
        ),
        bodyPhotos: createPhotoPlaceholders(form.bodyPhotos, 'body', uploadId),
      },
      budget: form.budget,
      availability: form.availability.trim(),
      bookingLocation: form.bookingLocation,
      travelDate: form.travelDate,
      submittedAt: new Date().toISOString(),
    }

    const createdRequest = appendTattooRequest(request)
    setSubmittedRequestId(createdRequest.id)
    setForm(initialForm)
    setSubmitted(true)
    event.currentTarget.reset()
  }

  const returnHome = () => {
    const homeUrl = `${window.location.pathname}${window.location.search}`
    window.history.pushState(null, '', homeUrl)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const clientName =
    form.firstName || form.lastName
      ? `${form.firstName} ${form.lastName}`.trim()
      : 'Not set'
  const locationName = form.bookingLocation || 'Not set'

  return (
    <main className="grid min-h-screen bg-[#f7f0e8] lg:grid-cols-[minmax(300px,410px)_minmax(0,1fr)]">
      <aside
        className="relative box-border min-h-auto border-white/15 bg-[#1b1715] bg-[length:132px_auto] bg-[right_18px_top_18px] bg-no-repeat px-5.5 py-7 text-[#fffaf5] lg:min-h-screen lg:border-r lg:bg-[length:230px_auto] lg:bg-[center_22%] lg:p-10"
        style={{
          backgroundImage: `linear-gradient(rgba(27, 23, 21, 0.86), rgba(27, 23, 21, 0.9)), url(${heroImg})`,
        }}
      >
        <a
          className="mb-8 grid size-11 place-items-center rounded-lg border border-white/25 bg-white/10 font-bold text-[#fffaf5] transition hover:-translate-y-px hover:border-[#f3b29b]/70 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#f3b29b]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1715] lg:mb-10.5"
          href="/"
          aria-label="Back to homepage"
          onClick={(event) => {
            event.preventDefault()
            returnHome()
          }}
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
        <h4 className="m-0 mt-2 max-w-[11ch] text-[clamp(2.45rem,6vw,2.65rem)] leading-[0.96] font-bold text-[#f3b29b] ">
          Nila B
          <br /> 
          Request Form
        </h4>
        <p className="mt-5 max-w-[30ch] text-sm leading-relaxed text-[#fffaf5]/78">
          {settings.requestFormMessage}
        </p>

        <div
          className="mt-8.5 border-t border-white/15 pt-7"
          aria-label="Required fields completed"
        >
          <div className="flex items-center justify-between gap-4 text-sm text-[#fffaf5]/80">
            <span>Progress</span>
            <strong className="text-base text-[#fffaf5]">{completion}%</strong>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-label="Request readiness"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completion}
          >
            <div
              className="h-full rounded-full bg-[#f3b29b] transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="mt-8.5 hidden border-t border-white/15 pt-7 lg:block">
          <h2 className="mb-4.5 text-base font-bold text-[#fffaf5]">
            Request snapshot
          </h2>
          <dl className="grid gap-3.5">
            {[
              { label: 'Name', value: clientName },
              { label: 'Booking location', value: locationName },
              {
                label: 'Size',
                value:
                  form.width && form.height
                    ? `${form.width} x ${form.height} ${form.unit}`
                    : 'Not set',
              },
              { label: 'Placement', value: form.placement || 'Not set' },
              { label: 'Style', value: form.style },
              { label: 'Color', value: form.colorMode },
              { label: 'Coverup', value: form.isCoverup },
              { label: 'Budget', value: form.budget || 'Not set' },
            ].map((item) => (
              <div className="grid gap-1" key={item.label}>
                <dt className="text-xs text-[#fffaf5]/55">{item.label}</dt>
                <dd className="m-0 text-[#fffaf5]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      <form
        className="grid min-w-0 content-start gap-7 px-4.5 py-6.5 lg:p-10"
        onSubmit={handleSubmit}
      >
        <section className={sectionClass} aria-labelledby="contact-heading">
          <div className={stepHeaderClass}>
            <p className={stepNumberClass}>01</p>
            <h2 className={stepTitleClass} id="contact-heading">
              Your Information
            </h2>
          </div>

          <div className="grid gap-4.5 md:grid-cols-2">
            <label className={labelClass}>
              <FieldText required>First name</FieldText>
              <input
                className={inputClass}
                required
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                autoComplete="given-name"
              />
            </label>
            <label className={labelClass}>
              <FieldText>Last name</FieldText>
              <input
                className={inputClass}
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                autoComplete="family-name"
              />
            </label>
            <label className={labelClass}>
              <FieldText required>Email</FieldText>
              <input
                className={inputClass}
                required
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                autoComplete="email"
              />
            </label>
            <label className={labelClass}>
              <FieldText>Phone</FieldText>
              <input
                className={inputClass}
                type="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                autoComplete="tel"
              />
            </label>
          </div>

          <div className="grid gap-4.5 md:grid-cols-2">
            <label className={labelClass}>
              <FieldText required>City hoping to book in</FieldText>
              <select
                className={inputClass}
                required
                value={form.bookingLocation}
                onChange={(event) => {
                  updateField('bookingLocation', event.target.value)
                  updateField('travelDate', '')
                }}
              >
                <option value="">Select city</option>
                {settings.bookingLocations.map((location: BookingLocation) => (
                  <option key={location.city} value={location.city}>
                    {location.city}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <FieldText>Artist travel date</FieldText>
              <select
                className={inputClass}
                value={form.travelDate}
                onChange={(event) => updateField('travelDate', event.target.value)}
                disabled={!selectedBookingLocation?.travelDates.length}
              >
                <option value="">
                  {selectedBookingLocation?.travelDates.length
                    ? 'Select travel date'
                    : 'No dates listed yet'}
                </option>
                {selectedBookingLocation?.travelDates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={labelClass}>
            <FieldText>Availability or timing notes</FieldText>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.availability}
              onChange={(event) => updateField('availability', event.target.value)}
              placeholder="Preferred days, deadlines, travel windows, or how soon you want to start..."
            />
          </label>
        </section>

        <section className={sectionClass} aria-labelledby="tattoo-heading">
          <div className={stepHeaderClass}>
            <p className={stepNumberClass}>02</p>
            <h2 className={stepTitleClass} id="tattoo-heading">
              Description
            </h2>
          </div>

          <label className={labelClass}>
            <FieldText required>Description</FieldText>
            <textarea
              className={textareaClass}
              required
              rows={5}
              value={form.tattooDescription}
              onChange={(event) =>
                updateField('tattooDescription', event.target.value)
              }
              placeholder="Please type exact text here for any script or attach photo if in a different langauge or specific handwriting"
            />
          </label>

          <div className="grid gap-4.5 md:grid-cols-[1fr_1fr_120px]">
            <label className={labelClass}>
              <FieldText required>Width</FieldText>
              <input
                className={inputClass}
                required
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                value={form.width}
                onChange={(event) => updateField('width', event.target.value)}
                placeholder="4"
              />
            </label>
            <label className={labelClass}>
              <FieldText required>Height</FieldText>
              <input
                className={inputClass}
                required
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                value={form.height}
                onChange={(event) => updateField('height', event.target.value)}
                placeholder="6"
              />
            </label>
            <label className={labelClass}>
              <FieldText>Unit</FieldText>
              <select
                className={inputClass}
                value={form.unit}
                onChange={(event) =>
                  updateField('unit', event.target.value as TattooIntakeForm['unit'])
                }
              >
                <option value="in">in</option>
                <option value="cm">cm</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4.5 md:grid-cols-2">
            <label className={labelClass}>
              <FieldText required>Placement on body</FieldText>
              <select
                className={inputClass}
                required
                value={form.placement}
                onChange={(event) => updateField('placement', event.target.value)}
              >
                <option value="">Select placement</option>
                {placements.map((placement) => (
                  <option key={placement}>{placement}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <FieldText>Preferred budget range</FieldText>
              <select
                className={inputClass}
                value={form.budget}
                onChange={(event) => updateField('budget', event.target.value)}
              >
                <option value="">Select budget</option>
                {budgets.map((budget) => (
                  <option key={budget}>{budget}</option>
                ))}
              </select>
            </label>
          </div>

          <label className={labelClass}>
            <FieldText>Placement notes</FieldText>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.placementNotes}
              onChange={(event) => updateField('placementNotes', event.target.value)}
              placeholder="Exact area, side of body, open to artist recommendation, wraps around, near existing tattoos..."
            />
          </label>

          <fieldset className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <legend className="col-span-full mb-0 text-sm font-bold text-[#5a4d46]">
              <FieldText>Color preference</FieldText>
            </legend>
            {colorModes.map((colorMode) => (
              <label className="cursor-pointer" key={colorMode}>
                <input
                  className="peer sr-only"
                  type="radio"
                  name="colorMode"
                  checked={form.colorMode === colorMode}
                  onChange={() => updateField('colorMode', colorMode)}
                />
                <span className={choiceClass}>{colorMode}</span>
              </label>
            ))}
          </fieldset>

          <label className={labelClass}>
            <FieldText>Style Preference</FieldText>
            <input
              className={inputClass}
              value={form.style}
              onChange={(event) => updateField('style', event.target.value)}
              placeholder="Fineline, realism, script, ornamental, not sure yet..."
            />
          </label>

          <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="col-span-full mb-0 text-sm font-bold text-[#5a4d46]">
              <FieldText>Coverup or rework</FieldText>
            </legend>
            {['No', 'Yes', 'Not sure'].map((answer) => (
              <label className="cursor-pointer" key={answer}>
                <input
                  className="peer sr-only"
                  type="radio"
                  name="isCoverup"
                  checked={form.isCoverup === answer}
                  onChange={() => updateField('isCoverup', answer)}
                />
                <span className={choiceClass}>{answer}</span>
              </label>
            ))}
          </fieldset>

          {form.isCoverup !== 'No' && (
            <label className={labelClass}>
              <FieldText>Coverup notes</FieldText>
              <textarea
                className={textareaClass}
                rows={3}
                value={form.coverupNotes}
                onChange={(event) => updateField('coverupNotes', event.target.value)}
                placeholder="Age of current tattoo, laser sessions, how dark it is, what you want covered..."
              />
            </label>
          )}
        </section>

        <section className={sectionClass} aria-labelledby="photos-heading">
          <div className={stepHeaderClass}>
            <p className={stepNumberClass}>03</p>
            <h2 className={stepTitleClass} id="photos-heading">
              Photos
            </h2>
          </div>

          <div className="grid gap-4.5 md:grid-cols-2">
            <label className={labelClass}>
              <FieldText>Reference photos</FieldText>
              <input
                className="peer sr-only"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  updateField('referencePhotos', event.target.files)
                }
              />
              <FileUploadText
                title="Upload inspiration, sketches, or style references"
                files={form.referencePhotos}
              />
            </label>
            <label className={labelClass}>
              <FieldText>Photos of the placement area</FieldText>
              <input
                className="peer sr-only"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => updateField('bodyPhotos', event.target.files)}
              />
              <FileUploadText
                title="Upload clear photos of the area to be tattooed"
                files={form.bodyPhotos}
              />
            </label>
          </div>

        </section>

        <section
          className="flex w-full max-w-[940px] flex-col items-stretch justify-between gap-5 sm:flex-row sm:items-center"
          aria-label="Submit request form"
        >
          <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-[#5a4d46]">
            <input
              className="peer sr-only"
              type="checkbox"
              checked={form.consent}
              onChange={(event) => updateField('consent', event.target.checked)}
            />
            <span
              className="grid size-[20px] shrink-0 place-items-center rounded border border-[#c9beb1] bg-white transition after:hidden after:size-2 after:rounded-[2px] after:bg-white after:content-[''] peer-checked:border-[#8f4536] peer-checked:bg-[#8f4536] peer-checked:after:block peer-focus-visible:ring-3 peer-focus-visible:ring-[#8f4536]/25 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#f7f0e8]"
              aria-hidden="true"
            />
            <span>I agree to be contacted about this request.</span>
          </label>
          <button
            className="min-h-[46px] rounded-lg bg-[#8f4536] px-5 font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#b49b90] disabled:text-white/70 sm:w-auto"
            type="submit"
            disabled={!form.consent || submitted}
          >
            {submitted ? 'Request sent' : 'Send request'}
          </button>
        </section>

        {submitted && (
          <p
            className="m-0 -mt-2 w-full max-w-[940px] rounded-lg border border-[#dfb9aa] bg-[#fff1eb] px-4 py-3.5 font-bold text-[#5b2117]"
            role="status"
          >
            Request {formatRequestId(submittedRequestId)} submitted. This has
            the core details needed to review cost, timeline, and session count.
          </p>
        )}
      </form>
    </main>
  )
}
