import { Link } from 'react-router-dom'
import DashboardFolderNav from './DashboardFolderNav'
import type { DashboardFilter, FolderKey } from './dashboardTypes'

type DashboardSidebarProps = {
  activeFilter: FolderKey
  filters: DashboardFilter[]
  isDark: boolean
  mutedTextClass: string
  onEmptyDeleted: () => void
  onOpenSettings: () => void
  onSelectFilter: (filter: FolderKey) => void
}

/** Sidebar navigation and artist identity for the admin dashboard. */
export default function DashboardSidebar({
  activeFilter,
  filters,
  isDark,
  mutedTextClass,
  onEmptyDeleted,
  onOpenSettings,
  onSelectFilter,
}: DashboardSidebarProps) {
  const iconActionClass = `grid size-11 place-items-center rounded-lg transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 ${
    isDark
      ? 'bg-[#211d1a] text-[#cbbdb3] hover:bg-[#2b2420] hover:text-[#f3d6ca]'
      : 'bg-[#f6eee7] text-[#8f4536] hover:bg-[#f1e5da]'
  }`

  return (
    <aside
      className={`min-w-0 px-4 py-4 shadow-[0_1px_0_rgba(143,69,54,0.12)] xl:px-5 xl:py-5 xl:shadow-[1px_0_0_rgba(143,69,54,0.10)] ${
        isDark ? 'bg-[#171311]' : 'bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-3 xl:block">
        <div className="flex items-center gap-2">
          <Link
            className={iconActionClass}
            to="/"
            aria-label="Home"
            title="Home"
          >
            <svg
              className="size-5.5"
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
          </Link>
          <button
            className={iconActionClass}
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
          >
            <svg
              aria-hidden="true"
              className="size-5.5"
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

        <div
          className={`min-w-0 text-right xl:mt-8 xl:border-b xl:pb-5 xl:text-left ${
            isDark ? 'xl:border-[#2c2622]' : 'xl:border-[#eadfd4]'
          }`}
        >
          <h1 className="m-0 text-2xl leading-tight font-bold xl:text-3xl">
            Overview
          </h1>
        </div>
      </div>

      {/* Folders wrap into compact columns on mobile/tablet. */}
      <DashboardFolderNav
        activeKey={activeFilter}
        filters={filters}
        isDark={isDark}
        mutedTextClass={mutedTextClass}
        onSelect={onSelectFilter}
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
