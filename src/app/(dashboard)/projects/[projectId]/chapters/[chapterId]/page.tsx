import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PipelineVisual } from '@/components/pipeline/pipeline-visual';
import { Badge } from '@/components/ui/badge';
import { StageActions } from '@/components/pipeline/stage-actions';
import { ExportButton } from '@/components/pipeline/export-button';
import { DeleteButton } from '@/components/ui/delete-button';
import { deletePage } from '@/lib/actions/projects';

const QC_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
  approved: 'success',
  needs_review: 'warning',
  critical_error: 'danger',
  pending: 'secondary',
};

export default async function ChapterPipelinePage({
  params,
}: {
  params: Promise<{ projectId: string; chapterId: string }>;
}) {
  const { projectId, chapterId } = await params;
  const supabase = await createClient();

  const { data: chapter } = await supabase.from('chapters').select('*').eq('id', chapterId).single();
  if (!chapter) notFound();

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true });

  const { data: failedJobs } = await supabase
    .from('ai_jobs')
    .select('stage')
    .eq('chapter_id', chapterId)
    .eq('status', 'failed');

  const failedStages = Array.from(new Set((failedJobs ?? []).map((j) => j.stage)));

  return (
    <div className="space-y-6 p-8">
      <div>
        <Link href={`/projects/${projectId}`} className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao projeto</Link>
        <h1 className="mt-1 text-2xl font-bold">Capítulo {chapter.number}{chapter.title ? ` — ${chapter.title}` : ''}</h1>
      </div>

      <PipelineVisual currentStage={chapter.current_stage} failedStages={failedStages as never} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StageActions projectId={projectId} chapterId={chapterId} currentStage={chapter.current_stage} />
        <ExportButton projectId={projectId} chapterId={chapterId} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Páginas ({pages?.length ?? 0})</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {pages?.map((p) => (
            <div key={p.id} className="group relative">
              <div className="absolute right-1.5 top-1.5 z-10 rounded-md bg-black/60 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <DeleteButton
                  onDelete={() => deletePage(projectId, chapterId, p.id)}
                  confirmMessage={`Excluir a página #${p.page_number}? Essa ação não pode ser desfeita.`}
                  className="text-white hover:text-destructive"
                />
              </div>
              <Link href={`/editor/${p.id}`}>
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-secondary">
                  <Image src={p.final_image_url || p.clean_image_url || p.original_image_url} alt={`Página ${p.page_number}`} fill className="object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">#{p.page_number}</span>
                  <Badge variant={QC_VARIANT[p.qc_status]} className="text-[9px]">{p.qc_status}</Badge>
                </div>
              </Link>
            </div>
          ))}
        </div>
        {(!pages || pages.length === 0) && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            Nenhuma página enviada ainda. Volte ao projeto e faça upload.
          </div>
        )}
      </div>
    </div>
  );
}
