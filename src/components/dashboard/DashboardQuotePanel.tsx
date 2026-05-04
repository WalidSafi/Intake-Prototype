import type { AdminTemplates } from './dashboardTypes'

type DashboardQuotePanelProps = {
  compactInputClass: string
  isDark: boolean
  mutedTextClass: string
  onMarkQuoted: () => void
  onSelectedTemplateChange: (template: string) => void
  selectedTemplate: string
  templates: AdminTemplates
}

/** Renders quote-template selection without owning request status transitions. */
export default function DashboardQuotePanel({
  compactInputClass,
  isDark,
  mutedTextClass,
  onMarkQuoted,
  onSelectedTemplateChange,
  selectedTemplate,
  templates,
}: DashboardQuotePanelProps) {
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
          <h3 className="m-0 text-lg font-bold">Quote templates</h3>
          <p className={`m-0 text-sm font-semibold ${mutedTextClass}`}>
            Pick a saved quote shortcut, then mark this request quoted.
          </p>
        </div>
        <button
          className="min-h-[34px] rounded-lg bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!selectedTemplate}
          onClick={onMarkQuoted}
        >
          Mark quoted
        </button>
      </div>
      <select
        className={compactInputClass}
        value={selectedTemplate}
        onChange={(event) => onSelectedTemplateChange(event.target.value)}
      >
        <option value="">Choose quote template</option>
        {templates.quoteTemplates.map((template) => (
          <option key={template} value={template}>
            {template}
          </option>
        ))}
      </select>
      {selectedTemplate && (
        <p className={`m-0 text-sm leading-relaxed ${mutedTextClass}`}>
          {selectedTemplate}
        </p>
      )}
    </div>
  )
}
