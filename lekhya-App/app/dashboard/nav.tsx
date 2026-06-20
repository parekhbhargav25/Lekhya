export type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
};

export const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/receipts",
    label: "Receipts",
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 4v17l3-2 3 2 3-2 3 2 3-2 1 2V4Z" />
        <path d="M8 9h8" />
        <path d="M8 13h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/recurring",
    label: "Recurring",
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/duplicates",
    label: "Duplicates",
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M4 16V6a2 2 0 0 1 2-2h10" />
      </svg>
    ),
  },
  {
    href: "/dashboard/gmail",
    label: "Gmail Sync",
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
];

export function isNavActive(pathname: string | null, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname?.startsWith(href) ?? false;
}
