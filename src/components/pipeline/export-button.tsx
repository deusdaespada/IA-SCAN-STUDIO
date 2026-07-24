'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function ExportButton({ projectId, chapterId }: { projectId: string; chapterId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setFileUrl(null);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, chapterId, format: 'cbz', scope: 'chapter' }),
      });
      const data = await res.json();
      if (data.fileUrl) setFileUrl(data.fileUrl);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={handleExport} disabled={loading}>
        <Download className="mr-2 h-3.5 w-3.5" />
        {loading ? 'Exportando...' : 'Exportar CBZ'}
      </Button>
      {fileUrl && (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
          Baixar arquivo
        </a>
      )}
    </div>
  );
}
