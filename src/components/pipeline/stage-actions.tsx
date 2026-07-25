'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, PlayCircle } from 'lucide-react';
import { PIPELINE_STAGES, type PipelineStage } from '@/types/domain';

const RUNNABLE_STAGES: PipelineStage[] = ['ocr', 'translation', 'review'];

export function StageActions({
  projectId,
  chapterId,
  currentStage,
}: {
  projectId: string;
  chapterId: string;
  currentStage: PipelineStage;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);

  async function runStage(stage: PipelineStage) {
    setLoading(stage);
    try {
      await fetch('/api/jobs/process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stages: [stage], batchSize: 20 }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function runFullPipeline() {
    setLoading('all');
    try {
      await fetch('/api/jobs/process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stages: RUNNABLE_STAGES, batchSize: 50 }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-4">
      <Button size="sm" onClick={runFullPipeline} disabled={loading !== null}>
        <PlayCircle className="mr-2 h-4 w-4" />
        {loading === 'all' ? 'Executando pipeline...' : 'Executar pipeline completo'}
      </Button>
      {RUNNABLE_STAGES.map((stage) => (
        <Button key={stage} size="sm" variant="outline" onClick={() => runStage(stage)} disabled={loading !== null}>
          <Play className="mr-2 h-3.5 w-3.5" />
          {loading === stage ? 'Rodando...' : PIPELINE_STAGES.find((s) => s.key === stage)?.label}
        </Button>
      ))}
      <Button size="sm" variant="ghost" onClick={() => runStage(currentStage)} disabled={loading !== null}>
        <RotateCcw className="mr-2 h-3.5 w-3.5" /> Repetir etapa atual
      </Button>
    </div>
  );
}
