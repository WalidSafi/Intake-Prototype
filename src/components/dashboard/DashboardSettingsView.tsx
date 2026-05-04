import type { FormEventHandler } from 'react'
import DashboardSettingsPanel from './DashboardSettingsPanel'
import type { TemplateForm } from './dashboardTypes'

type DashboardSettingsViewProps = {
  compactInputClass: string
  compactTextareaClass: string
  isDark: boolean
  mutedTextClass: string
  onBack: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onTemplateFieldChange: <Field extends keyof TemplateForm>(
    field: Field,
    value: TemplateForm[Field],
  ) => void
  panelClass: string
  statusMessage: string
  templateForm: TemplateForm
}

/** Full settings screen for artist request-form and booking configuration. */
export default function DashboardSettingsView({
  compactInputClass,
  compactTextareaClass,
  isDark,
  mutedTextClass,
  onBack,
  onSubmit,
  onTemplateFieldChange,
  panelClass,
  statusMessage,
  templateForm,
}: DashboardSettingsViewProps) {
  return (
    <section
      className={`min-h-screen border-b px-4 py-5 sm:px-6 xl:px-8 ${
        isDark ? 'border-[#3c332e] bg-[#211d1a]' : 'border-[#dbd1c5] bg-white/75'
      }`}
      aria-labelledby="settings-heading"
    >
      <div className="mx-auto grid w-full max-w-[920px] gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="m-0 text-xs font-bold tracking-[0.12em] text-[#b95f43] uppercase">
              Artist dashboard
            </p>
            <h1 className="m-0 text-3xl leading-tight font-bold" id="settings-heading">
              Settings
            </h1>
            <p className={`m-0 mt-1 text-sm font-semibold ${mutedTextClass}`}>
              Configure the public request form, booking cities, travel dates, and templates.
            </p>
          </div>
          <button
            className={`min-h-[40px] rounded-lg border px-4 text-sm font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
              isDark
                ? 'border-[#3c332e] bg-[#181514] text-[#cbbdb3]'
                : 'border-[#c9beb1] bg-white text-[#5a4d46]'
            }`}
            type="button"
            onClick={onBack}
          >
            Back to dashboard
          </button>
        </div>

        {statusMessage && (
          <p
            className={`m-0 rounded-lg border px-3 py-2 text-sm font-bold ${
              isDark
                ? 'border-[#4a382f] bg-[#1b1715] text-[#f3d6ca]'
                : 'border-[#dfc8ba] bg-[#fff8f3] text-[#7a4638]'
            }`}
            role="status"
          >
            {statusMessage}
          </p>
        )}

        <DashboardSettingsPanel
          compactInputClass={compactInputClass}
          compactTextareaClass={compactTextareaClass}
          mutedTextClass={mutedTextClass}
          onSubmit={onSubmit}
          onTemplateFieldChange={onTemplateFieldChange}
          panelClass={panelClass}
          templateForm={templateForm}
        />
      </div>
    </section>
  )
}
