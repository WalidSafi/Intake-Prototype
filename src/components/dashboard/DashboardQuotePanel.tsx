import type { AdminTemplates } from './dashboardTypes'

type DashboardQuotePanelProps = {
  compactInputClass: string
  compactTextareaClass: string
  customQuote: string
  customQuoteCurrency: string
  customQuotePrice: string
  isDark: boolean
  mutedTextClass: string
  onCustomQuoteChange: (quote: string) => void
  onCustomQuoteCurrencyChange: (currency: string) => void
  onCustomQuotePriceChange: (price: string) => void
  onMarkQuoted: () => void
  onQuoteModeChange: (mode: QuoteMode) => void
  onSelectedTemplateChange: (template: string) => void
  quoteMode: QuoteMode
  selectedTemplate: string
  templates: AdminTemplates
}

export type QuoteMode = 'template' | 'custom'

const quoteCurrencyOptions = ['CAD', 'USD', 'EUR', 'GBP', 'JPY', 'AUD']

function getQuoteTemplateParts(template: string) {
  const [priceValue, ...textValues] = template.split('|')
  const price = priceValue.trim().startsWith('$')
    ? `CAD ${priceValue.trim()}`
    : priceValue.trim()
  const text = textValues.join('|').trim()

  return text ? { price, text } : { price: '', text: price }
}

/** Renders quote-template selection without owning request status transitions. */
export default function DashboardQuotePanel({
  compactInputClass,
  compactTextareaClass,
  customQuote,
  customQuoteCurrency,
  customQuotePrice,
  isDark,
  mutedTextClass,
  onCustomQuoteChange,
  onCustomQuoteCurrencyChange,
  onCustomQuotePriceChange,
  onMarkQuoted,
  onQuoteModeChange,
  onSelectedTemplateChange,
  quoteMode,
  selectedTemplate,
  templates,
}: DashboardQuotePanelProps) {
  const customQuotePriceLabel = customQuotePrice.trim()
    ? `${customQuoteCurrency} ${customQuotePrice.trim()}`
    : ''
  const activeQuote =
    quoteMode === 'template'
      ? selectedTemplate
      : [
          customQuotePriceLabel,
          customQuote.trim(),
        ].filter(Boolean).join(' | ')
  const selectedTemplateParts = getQuoteTemplateParts(selectedTemplate)

  return (
    <div
      className={`grid gap-3 rounded-lg border p-4 ${
        isDark
          ? 'border-[#3c332e] bg-[#181514]'
          : 'border-[#eadfd4] bg-[#fbf6f0]'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="m-0 text-lg font-bold">Quote</h3>
          <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
            Use a saved quote template or write a custom quote for this client.
          </p>
        </div>
        <button
          className="min-h-[34px] rounded-lg bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!activeQuote}
          onClick={onMarkQuoted}
        >
          Mark quoted
        </button>
      </div>

      <div
        className={`grid grid-cols-2 overflow-hidden rounded-lg border ${
          isDark ? 'border-[#3c332e]' : 'border-[#c9beb1]'
        }`}
        role="group"
        aria-label="Quote type"
      >
        {[
          { label: 'Template', value: 'template' },
          { label: 'Custom quote', value: 'custom' },
        ].map((option) => {
          const isActive = quoteMode === option.value

          return (
            <button
              className={`min-h-[38px] px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                isActive
                  ? 'bg-[#8f4536] text-white'
                  : isDark
                    ? 'bg-[#181514] text-[#cbbdb3] hover:bg-[#211d1a]'
                    : 'bg-white text-[#5a4d46] hover:bg-[#f7f0e8]'
              }`}
              key={option.value}
              type="button"
              onClick={() => onQuoteModeChange(option.value as QuoteMode)}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {quoteMode === 'template' ? (
        <div className="grid gap-2" aria-label="Choose quote template">
          {!templates.quoteTemplates.length && (
            <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
              No quote templates yet. Add priced templates in Settings or use a custom quote.
            </p>
          )}
          {templates.quoteTemplates.map((template) => {
            const templateParts = getQuoteTemplateParts(template)
            const isSelected = selectedTemplate === template

            return (
              <button
                className={`grid gap-2 rounded-lg border p-3 text-left transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
                  isSelected
                    ? 'border-[#b95f43] bg-[#fff1eb]'
                    : isDark
                      ? 'border-[#3c332e] bg-[#181514] hover:border-[#b95f43]'
                      : 'border-[#eadfd4] bg-white hover:border-[#b95f43]'
                }`}
                key={template}
                type="button"
                onClick={() => onSelectedTemplateChange(template)}
                aria-pressed={isSelected}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#8f4536] px-3 py-1 text-xs font-bold text-white">
                    {templateParts.price || 'No price'}
                  </span>
                  <span className={`text-xs font-bold ${mutedTextClass}`}>
                    Quote template
                  </span>
                </span>
                <span className="text-sm font-semibold">
                  {templateParts.text}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[96px_150px_minmax(0,1fr)]">
            <label className="grid gap-1 text-xs font-bold uppercase">
              Currency
              <select
                className={compactInputClass}
                value={customQuoteCurrency}
                onChange={(event) =>
                  onCustomQuoteCurrencyChange(event.target.value)
                }
              >
                {quoteCurrencyOptions.map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase">
              Price
              <input
                className={compactInputClass}
                value={customQuotePrice}
                inputMode="decimal"
                onChange={(event) => onCustomQuotePriceChange(event.target.value)}
                placeholder="$650"
              />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase">
              Custom quote for client
              <textarea
                className={compactTextareaClass}
                value={customQuote}
                onChange={(event) => onCustomQuoteChange(event.target.value)}
                placeholder="Design prep, stencil, and one 3-hour tattoo session. Deposit required to book."
              />
            </label>
          </div>
          {customQuotePriceLabel && (
            <span className="w-fit rounded-full bg-[#8f4536] px-3 py-1 text-xs font-bold text-white">
              Price: {customQuotePriceLabel}
            </span>
          )}
        </div>
      )}

      {activeQuote && (
        quoteMode === 'template' ? (
          <div className="grid gap-1">
            {selectedTemplateParts.price && (
              <p className="m-0 text-sm font-bold text-[#b95f43]">
                {selectedTemplateParts.price}
              </p>
            )}
            <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
              {selectedTemplateParts.text}
            </p>
          </div>
        ) : (
          <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
            {activeQuote}
          </p>
        )
      )}
    </div>
  )
}
