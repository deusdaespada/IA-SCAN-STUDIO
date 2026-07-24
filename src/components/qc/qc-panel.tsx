'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface QcResultRow {
  id: string;
  status: 'approved' | 'needs_review' | 'critical_error' | 'pending';
  issue_type: string | null;
  description: string | null;
  resolved: boolean;
}

const ICON = { approved: CheckCircle2, needs_review: AlertTriangle, critical_error: XCircle, pending: AlertTriangle };
const VARIANT = { approved: 'success', needs_review: 'warning', critical_error: 'danger', pending: 'secondary' } as const;

export function QcPanel({ pageId, results }: { pageId: string; results: QcResultRow[] }) {
  const router = useRouter();
  const supabase = createClient();

  async function resolveIssue(id: string) {
    await supabase.from('qc_results').update({ resolved: true }).eq('id', id);
    router.refresh();
  }

  async function runQc() {
    await fetch('/api/jobs/process', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stages: ['qc'], batchSize: 1 }),
    });
    router.refresh();
  }

  const pending = results.filter((r) => !r.resolved);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Quality Control</h2>
        <Button size="sm" variant="outline" onClick={runQc}>Rodar QC</Button>
      </div>

      {pending.length === 0 && (
        <div className="rounded-md border border-border p-4 text-center text-xs text-muted-foreground">
          Nenhum problema pendente nesta página.
        </div>
      )}

      <div className="space-y-2">
        {pending.map((r) => {
          const Icon = ICON[r.status];
          return (
            <div key={r.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <Badge variant={VARIANT[r.status]} className="text-[10px]">{r.issue_type ?? r.status}</Badge>
                </div>
              </div>
              {r.description && <p className="mt-2 text-xs text-muted-foreground">{r.description}</p>}
              <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={() => resolveIssue(r.id)}>
                Marcar como resolvido
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
