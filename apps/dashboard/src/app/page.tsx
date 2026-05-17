import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card';
import { AlertFeed } from '@/components/alert-feed';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { formatCurrency } from '@/lib/utils';

async function getKPIs() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [convResult, leadsResult, creativeResult, eventsResult] = await Promise.all([
    supabase.from('conversions').select('value').gte('created_at', today.toISOString()),
    supabase.from('leads').select('id', { count: 'exact' }).gte('created_at', today.toISOString()),
    supabase.from('creatives').select('score').eq('status', 'active').order('score', { ascending: false }).limit(1).single(),
    supabase.from('agent_events').select('id, source_agent, event_type, payload, created_at').order('created_at', { ascending: false }).limit(30),
  ]);

  const revenue = (convResult.data ?? []).reduce((sum: number, r: { value: number }) => sum + r.value, 0);
  const leadsToday = leadsResult.count ?? 0;
  const topScore = (creativeResult.data as { score?: number } | null)?.score ?? 0;

  return {
    revenue,
    leadsToday,
    topScore,
    events: eventsResult.data ?? [],
  };
}

async function getWeeklyRevenue() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const since = new Date();
  since.setDate(since.getDate() - 29);

  const { data } = await supabase
    .from('conversions')
    .select('value, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  // Group by day
  const byDay: Record<string, number> = {};
  for (const row of data ?? []) {
    const day = new Date(row.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    byDay[day] = (byDay[day] ?? 0) + row.value;
  }

  return Object.entries(byDay).map(([date, value]) => ({ date, value }));
}

export default async function Overview() {
  const [kpis, chartData] = await Promise.all([getKPIs(), getWeeklyRevenue()]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Overview</h1>
          <p className="text-sm text-[var(--muted-fg)]">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Receita Hoje</CardTitle></CardHeader>
          <CardValue>{formatCurrency(kpis.revenue)}</CardValue>
        </Card>
        <Card>
          <CardHeader><CardTitle>Leads Hoje</CardTitle></CardHeader>
          <CardValue>{kpis.leadsToday}</CardValue>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Criativo</CardTitle></CardHeader>
          <CardValue>{kpis.topScore > 0 ? `${kpis.topScore.toFixed(1)} / 10` : '—'}</CardValue>
        </Card>
        <Card>
          <CardHeader><CardTitle>Agentes Ativos</CardTitle></CardHeader>
          <CardValue>0 / 9</CardValue>
        </Card>
      </div>

      {/* Chart + Feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita — Últimos 30 dias</CardTitle>
          </CardHeader>
          <RevenueChart data={chartData} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feed de Eventos</CardTitle>
          </CardHeader>
          <AlertFeed initial={kpis.events as Parameters<typeof AlertFeed>[0]['initial']} />
        </Card>
      </div>
    </div>
  );
}
