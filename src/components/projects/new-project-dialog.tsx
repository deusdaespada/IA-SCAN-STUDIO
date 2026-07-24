'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProject } from '@/lib/actions/projects';

const WORK_TYPES = [
  ['manga', 'Mangá'],
  ['manhwa', 'Manhwa'],
  ['manhua', 'Manhua'],
  ['webtoon', 'Webtoon'],
  ['novel', 'Novel'],
  ['light_novel', 'Light Novel'],
  ['other', 'Outro'],
];

export function NewProjectDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Novo projeto</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </Dialog.Close>
          </div>

          <form action={createProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da obra</Label>
              <Input id="name" name="name" required placeholder="Ex: Solo Leveling" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="work_type">Tipo</Label>
                <select id="work_type" name="work_type" className="h-10 w-full rounded-md border border-input bg-secondary/50 px-3 text-sm">
                  {WORK_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_language">Idioma de destino</Label>
                <Input id="target_language" name="target_language" defaultValue="pt-BR" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="source_language">Idioma original</Label>
                <Input id="source_language" name="source_language" defaultValue="ko" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input id="author" name="author" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea id="description" name="description" rows={3} className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" name="tags" placeholder="ação, fantasia, sistema" />
            </div>

            <Button type="submit" className="w-full">Criar projeto</Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
