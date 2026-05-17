'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/',          label: 'Overview',    icon: '⬡' },
  { href: '/traffic',   label: 'Tráfego',     icon: '📈' },
  { href: '/creatives', label: 'Criativos',   icon: '✦' },
  { href: '/leads',     label: 'Leads / CRM', icon: '◈' },
  { href: '/organic',   label: 'Orgânico',    icon: '⟐' },
  { href: '/agents',    label: 'Agentes',     icon: '⬡', divider: true },
  { href: '/insights',  label: 'Insights',    icon: '◆' },
  { href: '/memory',    label: 'Memória',     icon: '◎' },
  { href: '/reports',   label: 'Relatórios',  icon: '≡' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-[var(--card-border)] bg-[var(--card)] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-[var(--card-border)]">
        <div className="h-7 w-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">J</div>
        <span className="font-semibold tracking-tight text-[var(--foreground)]">JARVIS</span>
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" title="Online" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item) => (
          <div key={item.href}>
            {item.divider && <div className="my-3 border-t border-[var(--card-border)]" />}
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-[var(--accent-muted)] text-white font-medium'
                  : 'text-[var(--muted-fg)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--card-border)]">
        <p className="text-xs text-[var(--muted-fg)]">v0.1.0 · Alfabetização</p>
      </div>
    </aside>
  );
}
