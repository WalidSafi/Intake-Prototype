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
}

function FolderIcon({ status }: { status: RequestStatus }) {
  if (status === 'new') {
    return (
      <svg aria-hidden="true" className="size-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 4h16v16H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    )
  }

  if (status === 'needs_review') {
    return (
      <svg aria-hidden="true" className="size-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  if (status === 'quoted') {
    return (
      <svg aria-hidden="true" className="size-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    )
  }

  if (status === 'approved_for_booking') {
    return (
      <svg aria-hidden="true" className="size-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }

  if (status === 'booked') {
    return (
      <svg aria-hidden="true" className="size-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M3 10h18" />
      </svg>
    )
  }

  if (status === 'completed') {
    return (
      <svg aria-hidden="true" className="size-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="m9 12 2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="size-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  )
}

/** Sidebar workflow folders with live counts for the current artist's requests. */
export default function DashboardFolderNav({
  activeKey,
  filters,
  isDark,
  mutedTextClass,
  onSelect,
}: DashboardFolderNavProps) {
  return (
    <nav
      className={`mt-4 grid overflow-hidden xl:mt-8 ${
        isDark ? 'divide-y divide-[#2c2622]' : 'divide-y divide-[#eadfd4]'
      }`}
      aria-label="Request filters"
    >
      {filters.map((item) => {
        const isActive = activeKey === item.key

        return (
          <button
            className={`group grid min-h-[52px] min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-1 py-2.5 text-left text-[0.95rem] font-bold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b95f43]/25 xl:px-0 ${
              isActive
                ? 'text-[#b95f43]'
                : `${mutedTextClass} hover:text-[#b95f43]`
            }`}
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
          >
            <span
              className={`grid size-9 place-items-center rounded-lg transition ${
                isActive
                  ? 'bg-[#8f4536] text-white shadow-[0_8px_22px_rgba(143,69,54,0.22)]'
                  : isDark
                    ? 'bg-[#211d1a] text-[#cbbdb3] group-hover:bg-[#2b2420] group-hover:text-[#f3d6ca]'
                    : 'bg-[#f6eee7] text-[#8f4536] group-hover:bg-[#f1e5da]'
              }`}
            >
              <FolderIcon status={item.key} />
            </span>
            <span className="truncate">{item.label}</span>
            <span
              className={`min-w-[32px] rounded-full px-2.5 py-1 text-center text-xs ${
                isActive
                  ? 'bg-[#8f4536] text-white'
                  : isDark
                    ? 'bg-[#211d1a] text-[#cbbdb3]'
                    : 'bg-[#f6eee7] text-[#7a4638]'
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
