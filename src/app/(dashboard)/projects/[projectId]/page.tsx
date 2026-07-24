import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UploadDialog } from '@/components/upload/upload-dialog';
import { NewChapterDialog } from '@/components/projects/new-chapter-dialog';
import { PIPELINE_STAGES } from '@/types/domain';

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (!project) notFound();

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('number', { ascending: true });

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{project.work_type}</Badge>
            <Badge variant="secondary">{project.source_language} → {project.target_language}</Badge>
            <Badge variant="secondary" className="capitalize">{project.status}</Badge>
          </div>
          {project.description && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <NewChapterDialog projectId={projectId} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Capítulos</h2>
        {(!chapters || chapters.length === 0) && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            Nenhum capítulo ainda. Crie um capítulo e faça upload das páginas.
          </div>
        )}
        <div className="space-y-2">
          {chapters?.map((c) => {
            const stageIndex = PIPELINE_STAGES.findIndex((s) => s.key === c.current_stage);
            const progressPct = ((stageIndex + 1) / PIPELINE_STAGES.length) * 100;
            return (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${projectId}/chapters/${c.id}`} className="font-medium hover:text-primary">
                      Capítulo {c.number}{c.title ? ` — ${c.title}` : ''}
                    </Link>
                    <Badge variant="secondary" className="text-[10px]">{c.page_count} páginas</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={progressPct} className="h-1.5 w-48" />
                    <span className="text-xs text-muted-foreground">
                      {PIPELINE_STAGES[stageIndex]?.label ?? c.current_stage}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UploadDialog projectId={projectId} chapterId={c.id} />
                  <Link href={`/projects/${projectId}/chapters/${c.id}`} className="text-sm text-primary hover:underline">
                    Abrir pipeline →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
