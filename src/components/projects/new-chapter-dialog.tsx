'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createChapter } from '@/lib/actions/projects';

export function NewChapterDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await createChapter(projectId, formData);
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Novo capítulo</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Novo capítulo</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </Dialog.Close>
          </div>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input id="number" name="number" type="number" step="0.5" required placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input id="title" name="title" />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Criando...' : 'Criar capítulo'}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
