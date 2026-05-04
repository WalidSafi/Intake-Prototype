import type { TattooRequestStatus as RequestStatus } from '../../data/tattooRequestStore'

type DashboardFolderNavItem = {
  count: number
  key: RequestStatus
  label: string
}

type DashboardFolderNavProps = {
  activeKey: RequestStatus
  filters: DashboardFolderNavItem[]
  isDark: boolean
  mutedTextClass: string
  onSelect: (key: RequestStatus) => void
  panelClass: string
}

/** Sidebar workflow folders with live counts for the current artist's requests. */
export default function DashboardFolderNav({
  activeKey,
  filters,
  isDark,
  mutedTextClass,
  onSelect,
  panelClass,
}: DashboardFolderNavProps) {
  return (
    <nav
      className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:mt-8 xl:grid-cols-1"
      aria-label="Request filters"
    >
      {filters.map((item) => {
        const isActive = activeKey === item.key

        return (
          <button
            className={`flex min-h-[40px] min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 text-left text-xs font-bold transition sm:text-sm xl:min-h-[44px] xl:px-3 ${
              isActive
                ? 'border-[#b95f43] bg-[#8f4536] text-white'
                : `${panelClass} ${mutedTextClass} hover:border-[#b95f43]`
            }`}
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
          >
            <span>{item.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isActive
                  ? 'bg-white/20 text-white'
                  : isDark
                    ? 'bg-[#302925] text-[#f3d6ca]'
                    : 'bg-[#f1e5da] text-[#7a4638]'
              }`}
            >
              {item.count}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
