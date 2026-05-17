import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { InsightsList } from '@/components/insights-list';
import { SeasonalWidget } from '@/components/seasonal-widget';

async function getData() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const in30days = new Date();
  in30days.setDate(in30days.getDate() + 30);

  const [recResult, seasonalResult] = await Promise.all([
    supabase
      .from('recommendations')
      .select('*')
      .eq('acted_on', false)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('seasonal_calendar')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', in30days.toISOString().split('T')[0])
      .order('date', { ascending: true }),
  ]);

  return {
    recommendations: recResult.data ?? [],
    seasonal: seasonalResult.data ?? [],
  };
}

export default async function InsightsPage() {
  const { recommendations, seasonal } = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Insights</h1>
        <p className="text-sm text-[var(--muted-fg)]">{recommendations.length} recomendação(ões) pendente(s)</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recomendações dos Agentes</CardTitle></CardHeader>
          <InsightsList
            initial={recommendations as Parameters<typeof InsightsList>[0]['initial']}
          />
        </Card>

        <Card>
          <CardHeader><CardTitle>Sazonalidade (30 dias)</CardTitle></CardHeader>
          <SeasonalWidget events={seasonal as Parameters<typeof SeasonalWidget>[0]['events']} />
        </Card>
      </div>
    </div>
  );
}
