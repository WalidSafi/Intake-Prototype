import { useState, type FormEventHandler } from 'react'
import type { TemplateForm } from './dashboardTypes'

type EditableLocation = {
  city: string
  travelDates: string[]
}

type EditableQuoteTemplate = {
  currency: string
  price: string
  text: string
}

type SocialPlatform = 'instagram' | 'tiktok' | 'website'

type EditableSocialLink = {
  platform: SocialPlatform
  url: string
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

const currencyOptions = ['CAD', 'USD', 'EUR', 'GBP', 'JPY', 'AUD']

const socialOptions: Array<{
  enabledField: keyof TemplateForm
  label: string
  platform: SocialPlatform
  placeholder: string
  urlField: keyof TemplateForm
}> = [
  {
    enabledField: 'instagramEnabled',
    label: 'Instagram',
    platform: 'instagram',
    placeholder: 'https://instagram.com/artistname',
    urlField: 'instagramUrl',
  },
  {
    enabledField: 'tiktokEnabled',
    label: 'TikTok',
    platform: 'tiktok',
    placeholder: 'https://tiktok.com/@artistname',
    urlField: 'tiktokUrl',
  },
  {
    enabledField: 'websiteEnabled',
    label: 'Portfolio',
    platform: 'website',
    placeholder: 'https://artistportfolio.com',
    urlField: 'websiteUrl',
  },
]

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
    travelDates: [travelDatesByCity[city]?.[0] ?? '', travelDatesByCity[city]?.[1] ?? ''],
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
  const currencyPattern = new RegExp(`^(${currencyOptions.join('|')})\\s+(.+)$`)
  const templates = value
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [firstValue, ...restValues] = row.split('|')
      const maybePrice = firstValue.trim()
      const text = restValues.join('|').trim()
      const currencyMatch = maybePrice.match(currencyPattern)

      if (!text) {
        return { currency: 'CAD', price: '', text: maybePrice }
      }

      return {
        currency: currencyMatch?.[1] ?? 'CAD',
        price: currencyMatch?.[2] ?? maybePrice,
        text,
      }
    })

  return templates
}

function formatQuoteTemplates(templates: EditableQuoteTemplate[]) {
  return templates
    .map((template) => {
      const currency = template.currency.trim()
      const price = template.price.trim()
      const text = template.text.trim()

      if (!price) {
        return text
      }

      return `${currency} ${price} | ${text}`
    })
    .filter(Boolean)
    .join('\n')
}

function getEditableSocialLinks(templateForm: TemplateForm): EditableSocialLink[] {
  return socialOptions
    .map((option) => ({
      platform: option.platform,
      url: String(templateForm[option.urlField] ?? ''),
      enabled: Boolean(templateForm[option.enabledField]),
    }))
    .filter((social) => social.enabled || social.url)
    .map((social) => ({
      platform: social.platform,
      url: social.url,
    }))
}

function getRangeDayCount(travelDates: string[]) {
  const [startDate, endDate] = travelDates

  if (!startDate && !endDate) {
    return 0
  }

  if (!startDate || !endDate) {
    return 1
  }

  const startTime = new Date(`${startDate}T00:00:00`).getTime()
  const endTime = new Date(`${endDate}T00:00:00`).getTime()

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    return 0
  }

  const dayDifference = Math.abs(endTime - startTime) / 86_400_000

  return Math.floor(dayDifference) + 1
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
  const [socialLinks, setSocialLinks] = useState(() =>
    getEditableSocialLinks(templateForm),
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

  const updateSocialLinks = (nextSocialLinks: EditableSocialLink[]) => {
    setSocialLinks(nextSocialLinks)

    socialOptions.forEach((option) => {
      const matchingSocial = nextSocialLinks.find(
        (social) => social.platform === option.platform,
      )

      onTemplateFieldChange(option.enabledField, Boolean(matchingSocial))
      onTemplateFieldChange(option.urlField, matchingSocial?.url ?? '')
    })
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
      <section className="grid gap-3" aria-labelledby="settings-request-heading">
        <h3 className="m-0 text-sm font-bold" id="settings-request-heading">
          Request form
        </h3>

        <label className="grid gap-1 text-xs font-bold uppercase">
          Message
          <textarea
            className={compactTextareaClass}
            value={templateForm.requestFormMessage}
            onChange={(event) =>
              onTemplateFieldChange('requestFormMessage', event.target.value)
            }
          />
        </label>

        <label className="grid gap-1 text-xs font-bold uppercase">
          Default city
          <input
            className={compactInputClass}
            value={templateForm.defaultLocation}
            onChange={(event) =>
              onTemplateFieldChange('defaultLocation', event.target.value)
            }
            placeholder="Main shop or home city"
          />
        </label>

        <div className="grid gap-2" aria-labelledby="settings-socials-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="m-0 text-sm font-bold" id="settings-socials-heading">
              Social links
            </h3>
            <button
              className={outlineButtonClass}
              type="button"
              disabled={socialLinks.length >= socialOptions.length}
              onClick={() => {
                const usedPlatforms = new Set(
                  socialLinks.map((social) => social.platform),
                )
                const nextOption =
                  socialOptions.find((option) => !usedPlatforms.has(option.platform)) ??
                  socialOptions[0]

                updateSocialLinks([
                  ...socialLinks,
                  { platform: nextOption.platform, url: '' },
                ])
              }}
            >
              Add social
            </button>
          </div>

          <div className="grid gap-3">
            {socialLinks.map((social, socialIndex) => {
              const currentOption =
                socialOptions.find((option) => option.platform === social.platform) ??
                socialOptions[0]

              return (
                <div
                  className="rounded-lg bg-[#b95f43]/[0.06] p-3"
                  key={`${social.platform}-${socialIndex}`}
                >
                  <div className="grid gap-3 sm:grid-cols-[140px_minmax(180px,1fr)_auto] sm:items-end">
                    <label className="grid gap-1 text-xs font-bold uppercase">
                      Type
                      <select
                        className={compactInputClass}
                        value={social.platform}
                        onChange={(event) => {
                          const nextPlatform = event.target.value as SocialPlatform
                          const nextSocialLinks = [...socialLinks]
                          nextSocialLinks[socialIndex] = {
                            ...social,
                            platform: nextPlatform,
                          }
                          updateSocialLinks(nextSocialLinks)
                        }}
                      >
                        {socialOptions.map((option) => {
                          const isUsed = socialLinks.some(
                            (savedSocial, savedIndex) =>
                              savedIndex !== socialIndex &&
                              savedSocial.platform === option.platform,
                          )

                          return (
                            <option
                              disabled={isUsed}
                              key={option.platform}
                              value={option.platform}
                            >
                              {option.label}
                            </option>
                          )
                        })}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase">
                      URL
                      <input
                        className={compactInputClass}
                        value={social.url}
                        onChange={(event) => {
                          const nextSocialLinks = [...socialLinks]
                          nextSocialLinks[socialIndex] = {
                            ...social,
                            url: event.target.value,
                          }
                          updateSocialLinks(nextSocialLinks)
                        }}
                        placeholder={currentOption.placeholder}
                      />
                    </label>
                    <button
                      className={`${iconButtonClass} self-end`}
                      type="button"
                      aria-label={`Remove ${currentOption.label} link`}
                      title="Remove social link"
                      onClick={() =>
                        updateSocialLinks(
                          socialLinks.filter((_, index) => index !== socialIndex),
                        )
                      }
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
            </div>
      </section>

      <section className="grid gap-3" aria-labelledby="settings-locations-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="m-0 text-sm font-bold" id="settings-locations-heading">
              Locations
            </h3>
          </div>
          <button
            className={outlineButtonClass}
            type="button"
            onClick={() =>
              updateLocations([...locations, { city: '', travelDates: ['', ''] }])
            }
          >
            Add location
          </button>
        </div>

        <div className="grid gap-3">
          {locations.map((location, locationIndex) => (
            <div
              className="rounded-lg bg-[#b95f43]/[0.06] p-3"
              key={`${location.city}-${locationIndex}`}
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(120px,1fr)_minmax(130px,0.75fr)_minmax(130px,0.75fr)_auto_auto] sm:items-end">
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
                <label className="grid gap-1 text-xs font-bold uppercase">
                  Start
                  <input
                    className={compactInputClass}
                    type="date"
                    value={location.travelDates[0] ?? ''}
                    onChange={(event) => {
                      const nextDates = [
                        event.target.value,
                        location.travelDates[1] ?? '',
                      ]
                      const nextLocations = [...locations]
                      nextLocations[locationIndex] = {
                        ...location,
                        travelDates: nextDates,
                      }
                      updateLocations(nextLocations)
                    }}
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase">
                  End
                  <input
                    className={compactInputClass}
                    type="date"
                    value={location.travelDates[1] ?? ''}
                    onChange={(event) => {
                      const nextDates = [
                        location.travelDates[0] ?? '',
                        event.target.value,
                      ]
                      const nextLocations = [...locations]
                      nextLocations[locationIndex] = {
                        ...location,
                        travelDates: nextDates,
                      }
                      updateLocations(nextLocations)
                    }}
                  />
                </label>
                <span className={`pb-2 text-xs font-bold normal-case ${mutedTextClass}`}>
                  {getRangeDayCount(location.travelDates)}{' '}
                  {getRangeDayCount(location.travelDates) === 1 ? 'day' : 'days'}
                </span>
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
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3" aria-labelledby="settings-quotes-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="m-0 text-sm font-bold" id="settings-quotes-heading">
              Quotes
            </h3>
          </div>
          <button
            className={outlineButtonClass}
            type="button"
            onClick={() =>
              updateQuoteTemplates([
                ...quoteTemplates,
                { currency: 'CAD', price: '', text: '' },
              ])
            }
          >
            Add quote
          </button>
        </div>

        <div className="grid gap-3">
          {quoteTemplates.map((template, templateIndex) => (
            <div
              className="rounded-lg bg-[#b95f43]/[0.06] p-3"
              key={`quote-template-${templateIndex}`}
            >
              <div className="grid gap-2 sm:grid-cols-[76px_104px_minmax(180px,1fr)_auto] sm:items-center">
                <label className="grid gap-1 text-xs font-bold uppercase">
                  Currency
                  <select
                    className={compactInputClass}
                    value={template.currency}
                    onChange={(event) => {
                      const nextTemplates = [...quoteTemplates]
                      nextTemplates[templateIndex] = {
                        ...template,
                        currency: event.target.value,
                      }
                      updateQuoteTemplates(nextTemplates)
                    }}
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency}>{currency}</option>
                    ))}
                  </select>
                </label>
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
                  Text
                  <input
                    className={compactInputClass}
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
                <button
                  className={`${iconButtonClass} self-end sm:self-center sm:mt-5`}
                  type="button"
                  aria-label="Remove quote template"
                  title="Remove quote template"
                  onClick={() =>
                    updateQuoteTemplates(
                      quoteTemplates.filter((_, index) => index !== templateIndex),
                    )
                  }
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        className={primaryButtonClass}
        type="submit"
      >
        Save
      </button>
    </form>
  )
}
