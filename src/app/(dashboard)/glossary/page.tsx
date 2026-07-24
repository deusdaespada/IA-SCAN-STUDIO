import { createClient } from '@/lib/supabase/server';
import { GlossaryTable } from '@/components/projects/glossary-table';

export default async function GlossaryPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from('projects').select('id, name').order('name');
  const { data: terms } = await supabase
    .from('glossaries')
    .select('id, term_original, term_translated, category, notes, project_id, projects(name)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Glossário</h1>
        <p className="text-muted-foreground">Termos consistentes usados pela IA durante a tradução</p>
      </div>
      <GlossaryTable projects={projects ?? []} terms={terms ?? []} />
    </div>
  );
}
