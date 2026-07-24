'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RotateCcw, X } from 'lucide-react';

export function JobRowActions({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();

  async function act(action: 'retry' | 'cancel') {
    await fetch('/api/jobs', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobId, action }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      {status === 'failed' && (
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => act('retry')} title="Repetir">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}
      {(status === 'queued' || status === 'processing') && (
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => act('cancel')} title="Cancelar">
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
