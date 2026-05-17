import { Badge } from './ui/badge';

interface SeasonalEvent {
  id: string;
  name: string;
  date: string;
  type: string;
  relevance_score: number;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function SeasonalWidget({ events }: { events: SeasonalEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-[var(--muted-fg)]">Sem eventos nos próximos 30 dias.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => {
        const days = daysUntil(ev.date);
        const urgency = days <= 7 ? 'danger' : days <= 14 ? 'warning' : 'info';
        return (
          <div key={ev.id} className="flex items-center gap-3">
            <div className="text-center w-10 shrink-0">
              <p className="text-lg font-bold text-[var(--foreground)]">{days}</p>
              <p className="text-xs text-[var(--muted-fg)]">dias</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">{ev.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={urgency}>{ev.type}</Badge>
                <span className="text-xs text-[var(--muted-fg)]">Score {ev.relevance_score}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
