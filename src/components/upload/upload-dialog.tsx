'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  pagesUploaded?: number;
}

const ACCEPTED = '.zip,.cbz,.cbr,.pdf,.png,.jpg,.jpeg,.webp';

export function UploadDialog({ projectId, chapterId }: { projectId: string; chapterId: string }) {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<FileState[]>([]);
  const [dragActive, setDragActive] = React.useState(false);
  const router = useRouter();

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles = Array.from(fileList).map((file) => ({ file, progress: 0, status: 'pending' as const }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  async function uploadFile(index: number) {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: 'uploading', progress: 0 } : f)));

    const fileState = files[index];
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('chapterId', chapterId);
    formData.append('file', fileState.file);

    try {
      const xhr = new XMLHttpRequest();
      const result = await new Promise<{ pagesUploaded?: number; error?: string }>((resolve, reject) => {
        xhr.open('POST', '/api/upload');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, progress: pct } : f)));
          }
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else reject(new Error(data.error || 'Falha no upload'));
          } catch {
            reject(new Error('Resposta inválida do servidor'));
          }
        };
        xhr.onerror = () => reject(new Error('Erro de rede durante o upload'));
        xhr.send(formData);
      });

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'done', progress: 100, pagesUploaded: result.pagesUploaded } : f))
      );
      router.refresh();
    } catch (err) {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'error', error: (err as Error).message } : f))
      );
    }
  }

  async function uploadAll() {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        // eslint-disable-next-line no-await-in-loop
        await uploadFile(i);
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="secondary"><UploadCloud className="mr-2 h-4 w-4" /> Upload</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Upload de páginas</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </Dialog.Close>
          </div>

          <label
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Arraste arquivos aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground">ZIP, CBZ, CBR, PDF, PNG, JPG, WEBP</p>
            <input type="file" multiple accept={ACCEPTED} className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </label>

          {files.length > 0 && (
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{f.file.name}</span>
                    {f.status === 'done' && <CheckCircle2 className="h-4 w-4 text-success" />}
                    {f.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                  </div>
                  {f.status === 'uploading' && <Progress value={f.progress} className="mt-2 h-1.5" />}
                  {f.status === 'done' && <p className="mt-1 text-xs text-success">{f.pagesUploaded} página(s) enviada(s)</p>}
                  {f.status === 'error' && <p className="mt-1 text-xs text-destructive">{f.error}</p>}
                </div>
              ))}
            </div>
          )}

          <Button className="mt-4 w-full" onClick={uploadAll} disabled={files.every((f) => f.status !== 'pending')}>
            Enviar {files.filter((f) => f.status === 'pending').length || ''}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
