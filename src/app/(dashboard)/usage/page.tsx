import { createClient } from '@/lib/supabase/server';
import { UsageCharts } from '@/components/dashboard/usage-charts';
import { formatBytes, formatNumber } from '@/lib/utils/format';

export default async function UsagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: usage } = await supabase
    .from('ai_usage')
    .select('created_at, input_tokens, output_tokens, ai_provider, operation')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })
    .limit(500);

  // Agrupa por dia para o gráfico
  const byDay = new Map<string, number>();
  for (const u of usage ?? []) {
    const day = new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    byDay.set(day, (byDay.get(day) ?? 0) + u.input_tokens + u.output_tokens);
  }
  const chartData = Array.from(byDay.entries()).map(([day, tokens]) => ({ day, tokens }));

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Uso</h1>
        <p className="text-muted-foreground">Consumo de IA e armazenamento da sua conta</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Plano atual</p>
          <p className="mt-1 text-xl font-bold capitalize">{profile?.plan}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Tokens usados</p>
          <p className="mt-1 text-xl font-bold">{formatNumber(profile?.ai_tokens_used ?? 0)} / {formatNumber(profile?.ai_tokens_limit ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Armazenamento</p>
          <p className="mt-1 text-xl font-bold">{formatBytes(profile?.storage_used_bytes ?? 0)} / {formatBytes(profile?.storage_limit_bytes ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Chamadas de IA registradas</p>
          <p className="mt-1 text-xl font-bold">{formatNumber(usage?.length ?? 0)}</p>
        </div>
      </div>

      <UsageCharts data={chartData} />
    </div>
  );
}
