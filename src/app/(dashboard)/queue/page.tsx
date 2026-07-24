import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { JobRowActions } from '@/components/pipeline/job-row-actions';
import { PIPELINE_STAGES } from '@/types/domain';

const STATUS_VARIANT: Record<string, 'secondary' | 'warning' | 'success' | 'danger'> = {
  queued: 'secondary',
  processing: 'warning',
  completed: 'success',
  failed: 'danger',
  canceled: 'secondary',
};

export default async function QueuePage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from('ai_jobs')
    .select('id, stage, status, priority, ai_provider, attempts, max_attempts, error_message, created_at, projects(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Fila de Processamento</h1>
        <p className="text-muted-foreground">Acompanhe todos os jobs de IA em execução</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Projeto</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provedor</th>
              <th className="px-4 py-3">Tentativas</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs?.map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-3">{(j.projects as unknown as { name: string })?.name ?? '—'}</td>
                <td className="px-4 py-3">{PIPELINE_STAGES.find((s) => s.key === j.stage)?.label ?? j.stage}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[j.status]}>{j.status}</Badge>
                  {j.error_message && <p className="mt-1 max-w-xs truncate text-xs text-destructive">{j.error_message}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{j.ai_provider ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{j.attempts}/{j.max_attempts}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(j.created_at).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3"><JobRowActions jobId={j.id} status={j.status} /></td>
              </tr>
            ))}
            {(!jobs || jobs.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum job na fila ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
