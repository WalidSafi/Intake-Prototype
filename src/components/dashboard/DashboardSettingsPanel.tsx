import { useState, type FormEventHandler } from 'react'
import type { TemplateForm } from './dashboardTypes'

type EditableLocation = {
  city: string
  travelDates: string[]
}

type EditableQuoteTemplate = {
  price: string
  text: string
}

type DashboardSettingsPanelProps = {
  compactInputClass: string
  compactTextareaClass: string
  mutedTextClass: string
  onSubmit: FormEventHandler<HTMLFormElement>
  onTemplateFieldChange: <Field extends keyof TemplateForm>(
    field: Field,
    value: TemplateForm[Field],
  ) => void
  panelClass: string
  templateForm: TemplateForm
}

const outlineButtonClass =
  'min-h-[36px] rounded-lg border px-3 text-xs font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25'

const primaryButtonClass =
  'min-h-[36px] rounded-lg bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25'

const iconButtonClass =
  'grid size-8 shrink-0 place-items-center rounded-lg text-[#8f4536] transition hover:-translate-y-px hover:bg-[#b95f43]/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 disabled:cursor-not-allowed disabled:opacity-40'

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  )
}

function parseTravelDatesByCity(value: string) {
  return value.split('\n').reduce<Record<string, string[]>>((datesByCity, row) => {
    const [cityValue, datesValue = ''] = row.split('|')
    const city = cityValue.trim()

    if (!city) {
      return datesByCity
    }

    datesByCity[city] = datesValue
      .split(',')
      .map((date) => date.trim())
      .filter(Boolean)

    return datesByCity
  }, {})
}

function getEditableLocations(templateForm: TemplateForm): EditableLocation[] {
  const travelDatesByCity = parseTravelDatesByCity(templateForm.travelDates)
  const cities = templateForm.bookingLocations
    .split('\n')
    .map((city) => city.trim())
    .filter(Boolean)

  const locations = cities.map((city) => ({
    city,
    travelDates: travelDatesByCity[city] ?? [],
  }))

  return locations
}

function formatLocations(locations: EditableLocation[]) {
  const populatedLocations = locations
    .map((location) => ({
      city: location.city.trim(),
      travelDates: location.travelDates
        .map((date) => date.trim())
        .filter(Boolean),
    }))
    .filter((location) => location.city || location.travelDates.length)

  return {
    bookingLocations: populatedLocations
      .map((location) => location.city)
      .filter(Boolean)
      .join('\n'),
    travelDates: populatedLocations
      .filter((location) => location.city)
      .map((location) => `${location.city} | ${location.travelDates.join(', ')}`)
      .join('\n'),
  }
}

function getEditableQuoteTemplates(value: string): EditableQuoteTemplate[] {
  const templates = value
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [firstValue, ...restValues] = row.split('|')
      const maybePrice = firstValue.trim()
      const text = restValues.join('|').trim()

      return text
        ? { price: maybePrice, text }
        : { price: '', text: maybePrice }
    })

  return templates.length ? templates : [{ price: '', text: '' }]
}

function formatQuoteTemplates(templates: EditableQuoteTemplate[]) {
  return templates
    .map((template) => {
      const price = template.price.trim()
      const text = template.text.trim()

      if (!price) {
        return text
      }

      return `${price} | ${text}`
    })
    .filter(Boolean)
    .join('\n')
}

/** Controlled settings panel for editing request form copy and reusable templates. */
export default function DashboardSettingsPanel({
  compactInputClass,
  compactTextareaClass,
  mutedTextClass,
  onSubmit,
  onTemplateFieldChange,
  panelClass,
  templateForm,
}: DashboardSettingsPanelProps) {
  const [locations, setLocations] = useState(() =>
    getEditableLocations(templateForm),
  )
  const [quoteTemplates, setQuoteTemplates] = useState(() =>
    getEditableQuoteTemplates(templateForm.quoteTemplates),
  )

  const updateLocations = (nextLocations: EditableLocation[]) => {
    setLocations(nextLocations)

    const formattedLocations = formatLocations(nextLocations)

    onTemplateFieldChange('bookingLocations', formattedLocations.bookingLocations)
    onTemplateFieldChange('travelDates', formattedLocations.travelDates)
  }

  const updateQuoteTemplates = (nextTemplates: EditableQuoteTemplate[]) => {
    setQuoteTemplates(nextTemplates)
    onTemplateFieldChange('quoteTemplates', formatQuoteTemplates(nextTemplates))
  }

  return (
    <form
      className={`grid gap-5 rounded-lg border p-4 ${panelClass}`}
      onSubmit={onSubmit}
    >
      <div>
        <h2 className="m-0 text-base font-bold">Settings</h2>
        <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
          These settings update the public request form and booking workflows.
        </p>
      </div>

      <label className="grid gap-1 text-xs font-bold uppercase">
        Request form message
        <textarea
          className={compactTextareaClass}
          value={templateForm.requestFormMessage}
          onChange={(event) =>
            onTemplateFieldChange('requestFormMessage', event.target.value)
          }
        />
      </label>

      <label className="grid gap-1 text-xs font-bold uppercase">
        Default location
        <input
          className={compactInputClass}
          value={templateForm.defaultLocation}
          onChange={(event) =>
            onTemplateFieldChange('defaultLocation', event.target.value)
          }
          placeholder="Main shop or home city"
        />
        <span className={`normal-case ${mutedTextClass}`}>
          Used when the artist is taking bookings at their regular shop or city.
        </span>
      </label>

      <section className="grid gap-3" aria-labelledby="settings-locations-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="m-0 text-sm font-bold" id="settings-locations-heading">
              Booking locations
            </h3>
            <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
              Add each city and the available travel dates shown on the intake form.
            </p>
          </div>
          <button
            className={outlineButtonClass}
            type="button"
            onClick={() =>
              updateLocations([...locations, { city: '', travelDates: [''] }])
            }
          >
            Add another location
          </button>
        </div>

        <div className="grid gap-3">
          {locations.map((location, locationIndex) => (
            <div
              className="grid gap-4 rounded-lg bg-[#b95f43]/[0.06] p-3 sm:p-4"
              key={`${location.city}-${locationIndex}`}
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <label className="grid gap-1 text-xs font-bold uppercase">
                  City
                  <input
                    className={compactInputClass}
                    value={location.city}
                    onChange={(event) => {
                      const nextLocations = [...locations]
                      nextLocations[locationIndex] = {
                        ...location,
                        city: event.target.value,
                      }
                      updateLocations(nextLocations)
                    }}
                    placeholder="Toronto"
                  />
                </label>
                <button
                  className={`${iconButtonClass} self-end`}
                  type="button"
                  aria-label={`Remove ${location.city || 'booking'} location`}
                  title="Remove location"
                  onClick={() =>
                    updateLocations(
                      locations.filter((_, index) => index !== locationIndex),
                    )
                  }
                >
                  <TrashIcon />
                </button>
              </div>

              <div className="grid gap-2">
                <p className="m-0 text-xs font-bold uppercase">Location dates</p>
                <div className="flex flex-wrap items-center gap-2">
                  {location.travelDates.map((travelDate, dateIndex) => (
                    <div
                      className="flex min-w-[190px] items-center gap-1"
                      key={`${travelDate}-${dateIndex}`}
                    >
                      <input
                        className={compactInputClass}
                        type="date"
                        value={travelDate}
                        aria-label={`${location.city || 'Location'} date ${dateIndex + 1}`}
                        onChange={(event) => {
                          const nextDates = [...location.travelDates]
                          nextDates[dateIndex] = event.target.value
                          const nextLocations = [...locations]
                          nextLocations[locationIndex] = {
                            ...location,
                            travelDates: nextDates,
                          }
                          updateLocations(nextLocations)
                        }}
                      />
                    </div>
                  ))}
                  <span className={`text-xs font-bold normal-case ${mutedTextClass}`}>
                    {location.travelDates.filter(Boolean).length} total{' '}
                    {location.travelDates.filter(Boolean).length === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <button
                  className={`${outlineButtonClass} w-fit`}
                  type="button"
                  onClick={() => {
                    const nextLocations = [...locations]
                    nextLocations[locationIndex] = {
                      ...location,
                      travelDates: [...location.travelDates, ''],
                    }
                    updateLocations(nextLocations)
                  }}
                >
                  Add date
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3" aria-labelledby="settings-quotes-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="m-0 text-sm font-bold" id="settings-quotes-heading">
              Quote templates
            </h3>
            <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
              Save reusable quote text with an optional price or range.
            </p>
          </div>
          <button
            className={outlineButtonClass}
            type="button"
            onClick={() =>
              updateQuoteTemplates([...quoteTemplates, { price: '', text: '' }])
            }
          >
            Add quote template
          </button>
        </div>

        <div className="grid gap-3">
          {quoteTemplates.map((template, templateIndex) => (
            <div
              className="grid gap-3 rounded-lg bg-[#b95f43]/[0.06] p-3 sm:p-4"
              key={`${template.price}-${template.text}-${templateIndex}`}
            >
              <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-end">
                <label className="grid gap-1 text-xs font-bold uppercase">
                  Price
                  <input
                    className={compactInputClass}
                    value={template.price}
                    inputMode="decimal"
                    onChange={(event) => {
                      const nextTemplates = [...quoteTemplates]
                      nextTemplates[templateIndex] = {
                        ...template,
                        price: event.target.value,
                      }
                      updateQuoteTemplates(nextTemplates)
                    }}
                    placeholder="$250"
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase">
                  Template text
                  <textarea
                    className={compactTextareaClass}
                    value={template.text}
                    onChange={(event) => {
                      const nextTemplates = [...quoteTemplates]
                      nextTemplates[templateIndex] = {
                        ...template,
                        text: event.target.value,
                      }
                      updateQuoteTemplates(nextTemplates)
                    }}
                    placeholder="Design prep, stencil, and one tattoo session."
                  />
                </label>
                {quoteTemplates.length > 1 && (
                  <button
                    className={outlineButtonClass}
                    type="button"
                    onClick={() =>
                      updateQuoteTemplates(
                        quoteTemplates.filter((_, index) => index !== templateIndex),
                      )
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        className={primaryButtonClass}
        type="submit"
      >
        Save settings
      </button>
    </form>
  )
}
