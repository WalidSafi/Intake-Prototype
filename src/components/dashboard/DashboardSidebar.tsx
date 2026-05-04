import type { FormEventHandler } from 'react'
import DashboardFolderNav from './DashboardFolderNav'
import DashboardSettingsPanel from './DashboardSettingsPanel'
import type { DashboardFilter, FolderKey, TemplateForm } from './dashboardTypes'

type DashboardSidebarArtist = {
  name: string
  socials?: {
    instagram?: string
  }
}

type DashboardSidebarProps = {
  activeFilter: FolderKey
  artist?: DashboardSidebarArtist
  compactTextareaClass: string
  filters: DashboardFilter[]
  isDark: boolean
  mutedTextClass: string
  onEmptyDeleted: () => void
  onSelectFilter: (filter: FolderKey) => void
  onSubmitSettings: FormEventHandler<HTMLFormElement>
  onTemplateFieldChange: <Field extends keyof TemplateForm>(
    field: Field,
    value: TemplateForm[Field],
  ) => void
  onToggleSettings: () => void
  panelClass: string
  showSettings: boolean
  templateForm: TemplateForm
}

/** Sidebar navigation, identity, and template settings for the admin dashboard. */
export default function DashboardSidebar({
  activeFilter,
  artist,
  compactTextareaClass,
  filters,
  isDark,
  mutedTextClass,
  onEmptyDeleted,
  onSelectFilter,
  onSubmitSettings,
  onTemplateFieldChange,
  onToggleSettings,
  panelClass,
  showSettings,
  templateForm,
}: DashboardSidebarProps) {
  return (
    <aside
      className={`min-w-0 border-b px-4 py-4 xl:border-b-0 xl:border-r xl:px-5 xl:py-5 ${
        isDark ? 'border-[#3c332e] bg-[#171311]' : 'border-[#dbd1c5] bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-3 xl:block">
        <div className="flex items-center gap-2">
          <a
            className="grid size-10 place-items-center rounded-lg text-[#b95f43] transition hover:bg-[#f1e5da]"
            href="#"
            aria-label="Home"
            title="Home"
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
          <button
            className={`grid size-10 place-items-center rounded-lg border transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
              showSettings
                ? 'border-[#b95f43] bg-[#8f4536] text-white'
                : `${panelClass} ${mutedTextClass}`
            }`}
            type="button"
            onClick={onToggleSettings}
            aria-label="Open settings"
            title="Settings"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.07A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.07A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.07A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.07A1.7 1.7 0 0 0 19.4 15Z" />
            </svg>
          </button>
        </div>

        <div className="min-w-0 text-right xl:mt-8 xl:text-left">
          <div className="flex min-w-0 items-center justify-end gap-2 xl:justify-start">
            <p className="m-0 truncate text-sm font-bold tracking-[0.12em] text-[#b95f43] uppercase xl:text-lg">
              {artist?.name}
            </p>
            {artist?.socials?.instagram && (
              <a
                className="grid size-8 shrink-0 place-items-center rounded-lg text-[#b95f43] transition hover:bg-[#f1e5da]"
                href={artist.socials.instagram}
                aria-label={`${artist.name} Instagram`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            )}
          </div>
          <h1 className="m-0 text-2xl leading-tight font-bold xl:text-3xl">
            Inbox
          </h1>
        </div>
      </div>

      {showSettings && (
        <DashboardSettingsPanel
          compactTextareaClass={compactTextareaClass}
          mutedTextClass={mutedTextClass}
          onSubmit={onSubmitSettings}
          onTemplateFieldChange={onTemplateFieldChange}
          panelClass={panelClass}
          templateForm={templateForm}
        />
      )}

      {/* Folders wrap into compact columns on mobile/tablet. */}
      <DashboardFolderNav
        activeKey={activeFilter}
        filters={filters}
        isDark={isDark}
        mutedTextClass={mutedTextClass}
        onSelect={onSelectFilter}
        panelClass={panelClass}
      />
      {activeFilter === 'archived' && (
        <button
          className={`mt-4 min-h-[42px] w-full rounded-lg border px-3 text-sm font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
            isDark
              ? 'border-[#5b3838] bg-[#2b1d1d] text-[#f0c4c4]'
              : 'border-[#d8aaaa] bg-[#fff5f5] text-[#743030]'
          }`}
          type="button"
          onClick={onEmptyDeleted}
        >
          Empty Deleted
        </button>
      )}
    </aside>
  )
}
