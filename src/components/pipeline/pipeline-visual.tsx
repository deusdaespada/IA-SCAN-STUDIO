'use client';

import { PIPELINE_STAGES, type PipelineStage } from '@/types/domain';
import { cn } from '@/lib/utils/cn';
import { Check, Loader2, AlertCircle, Circle } from 'lucide-react';

interface StageState {
  stage: PipelineStage;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export function PipelineVisual({ currentStage, failedStages = [] }: { currentStage: PipelineStage; failedStages?: PipelineStage[] }) {
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentStage);

  const states: StageState[] = PIPELINE_STAGES.map((s, i) => {
    if (failedStages.includes(s.key)) return { stage: s.key, status: 'failed' };
    if (i < currentIndex) return { stage: s.key, status: 'completed' };
    if (i === currentIndex) return { stage: s.key, status: 'processing' };
    return { stage: s.key, status: 'pending' };
  });

  return (
    <div className="flex items-center overflow-x-auto rounded-lg border border-border bg-card p-4">
      {states.map((s, i) => {
        const label = PIPELINE_STAGES[i].label;
        return (
          <div key={s.stage} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2',
                  s.status === 'completed' && 'border-success bg-success/15 text-success',
                  s.status === 'processing' && 'border-primary bg-primary/15 text-primary',
                  s.status === 'failed' && 'border-destructive bg-destructive/15 text-destructive',
                  s.status === 'pending' && 'border-border bg-secondary text-muted-foreground'
                )}
              >
                {s.status === 'completed' && <Check className="h-4 w-4" />}
                {s.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                {s.status === 'failed' && <AlertCircle className="h-4 w-4" />}
                {s.status === 'pending' && <Circle className="h-3 w-3" />}
              </div>
              <span className="whitespace-nowrap text-[11px] text-muted-foreground">{label}</span>
            </div>
            {i < states.length - 1 && (
              <div className={cn('mx-2 h-0.5 w-8', s.status === 'completed' ? 'bg-success' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
