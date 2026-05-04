import type { FormEventHandler } from 'react'
import type { TemplateForm } from './dashboardTypes'

type DashboardSettingsPanelProps = {
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

/** Controlled settings panel for editing reusable quote and session templates. */
export default function DashboardSettingsPanel({
  compactTextareaClass,
  mutedTextClass,
  onSubmit,
  onTemplateFieldChange,
  panelClass,
  templateForm,
}: DashboardSettingsPanelProps) {
  return (
    <form
      className={`mt-6 grid gap-3 rounded-lg border p-3 ${panelClass}`}
      onSubmit={onSubmit}
    >
      <div>
        <h2 className="m-0 text-base font-bold">Settings</h2>
        <p className={`m-0 text-xs font-semibold ${mutedTextClass}`}>
          Templates show up in quote and booking workflows.
        </p>
      </div>
      <label className="grid gap-1 text-xs font-bold uppercase">
        Quote templates
        <textarea
          className={compactTextareaClass}
          value={templateForm.quoteTemplates}
          onChange={(event) =>
            onTemplateFieldChange('quoteTemplates', event.target.value)
          }
        />
      </label>
      <label className="grid gap-1 text-xs font-bold uppercase">
        Session templates
        <textarea
          className={compactTextareaClass}
          value={templateForm.sessionTemplates}
          onChange={(event) =>
            onTemplateFieldChange('sessionTemplates', event.target.value)
          }
        />
      </label>
      <button
        className="min-h-[36px] rounded-lg bg-[#8f4536] px-3 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-[#723429] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25"
        type="submit"
      >
        Save settings
      </button>
    </form>
  )
}
