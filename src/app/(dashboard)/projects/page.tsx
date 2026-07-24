import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';
import { ProjectCard } from '@/components/projects/project-card';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, cover_url, work_type, target_language, status, tags, updated_at')
    .order('updated_at', { ascending: false });

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">Gerencie suas obras e capítulos</p>
        </div>
        <NewProjectDialog trigger={<Button><Plus className="mr-2 h-4 w-4" /> Novo projeto</Button>} />
      </div>

      {(!projects || projects.length === 0) && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          Nenhum projeto ainda. Clique em &quot;Novo projeto&quot; para começar.
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {projects?.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <ProjectCard project={p} />
          </Link>
        ))}
      </div>
    </div>
  );
}
