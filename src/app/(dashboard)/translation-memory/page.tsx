import { createClient } from '@/lib/supabase/server';

export default async function TranslationMemoryPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from('translation_memory')
    .select('id, source_text, target_text, usage_count, projects(name)')
    .order('usage_count', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Memória de Tradução</h1>
        <p className="text-muted-foreground">Pares de frases reutilizados automaticamente pela IA para manter consistência entre capítulos</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Projeto</th>
              <th className="px-4 py-3">Original</th>
              <th className="px-4 py-3">Tradução</th>
              <th className="px-4 py-3">Usos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries?.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-muted-foreground">{(e.projects as unknown as { name: string })?.name}</td>
                <td className="px-4 py-3">{e.source_text}</td>
                <td className="px-4 py-3">{e.target_text}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.usage_count}</td>
              </tr>
            ))}
            {(!entries || entries.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhuma entrada ainda — será preenchida automaticamente conforme as traduções forem feitas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
