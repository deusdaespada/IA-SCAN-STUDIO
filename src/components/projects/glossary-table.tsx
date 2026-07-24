'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { createGlossaryTerm, deleteGlossaryTerm } from '@/lib/actions/glossary';

interface Project { id: string; name: string }
interface Term {
  id: string;
  term_original: string;
  term_translated: string;
  category: string;
  notes: string | null;
  project_id: string;
  projects: { name: string } | null;
}

const CATEGORIES = [
  ['character', 'Personagem'],
  ['technique', 'Técnica'],
  ['organization', 'Organização'],
  ['place', 'Local'],
  ['item', 'Item'],
  ['other', 'Outro'],
];

export function GlossaryTable({ projects, terms }: { projects: Project[]; terms: Term[] }) {
  return (
    <div className="space-y-6">
      <form action={createGlossaryTerm} className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-5">
        <div className="space-y-1">
          <Label className="text-xs">Projeto</Label>
          <select name="project_id" required className="h-10 w-full rounded-md border border-input bg-secondary/50 px-2 text-sm">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Termo original</Label>
          <Input name="term_original" required placeholder="Jin-Woo" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tradução</Label>
          <Input name="term_translated" required placeholder="Jin-Woo" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Categoria</Label>
          <select name="category" className="h-10 w-full rounded-md border border-input bg-secondary/50 px-2 text-sm">
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Adicionar termo</Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Projeto</th>
              <th className="px-4 py-3">Original</th>
              <th className="px-4 py-3">Tradução</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {terms.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-muted-foreground">{t.projects?.name}</td>
                <td className="px-4 py-3 font-medium">{t.term_original}</td>
                <td className="px-4 py-3">{t.term_translated}</td>
                <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{t.category}</Badge></td>
                <td className="px-4 py-3">
                  <form action={deleteGlossaryTerm.bind(null, t.id)}>
                    <button className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </form>
                </td>
              </tr>
            ))}
            {terms.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum termo cadastrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
