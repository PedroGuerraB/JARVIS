import { cn } from '@/lib/utils';

const colors = {
  idle: 'bg-emerald-500',
  running: 'bg-blue-500 animate-pulse',
  error: 'bg-red-500',
  offline: 'bg-[var(--muted-fg)]',
};

export function StatusDot({ status }: { status: keyof typeof colors }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', status === 'running' ? 'bg-blue-400 animate-ping' : '')} />
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', colors[status])} />
    </span>
  );
}
