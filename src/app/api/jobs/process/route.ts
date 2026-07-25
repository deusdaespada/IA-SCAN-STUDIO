import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { processJob } from '@/lib/jobs/process-job';
import type { PipelineStage } from '@/types/domain';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * GET é chamado pelo Vercel Cron automaticamente, autenticado por CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  return handleProcessJobs({ stages: ['ocr', 'translation', 'review'], batchSize: 10 });
}

/**
 * POST é chamado pelos botões da interface (usuário logado). Autenticado pela
 * sessão do Supabase, não pelo CRON_SECRET — o navegador nunca deve conhecer
 * esse segredo.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  return handleProcessJobs({ stages: body.stages ?? ['ocr', 'translation', 'review'], batchSize: body.batchSize ?? 5 });
}

async function handleProcessJobs({ stages, batchSize }: { stages: string[]; batchSize: number }) {
  const admin = createAdminClient();

  const results: { jobId: string; status: string; error?: string }[] = [];

  for (let i = 0; i < batchSize; i++) {
    const { data: job } = await admin.rpc('claim_next_job', { p_stages: stages as PipelineStage[] }).single();
    if (!job) break;

    const jobRow = job as { id: string; project_id: string; max_attempts: number; attempts: number };

    try {
      const { data: project } = await admin.from('projects').select('owner_id').eq('id', jobRow.project_id).single();
      if (!project) throw new Error('Projeto não encontrado');

      const result = await processJob(job as never, project.owner_id);

      await admin
        .from('ai_jobs')
        .update({ status: 'completed', finished_at: new Date().toISOString(), result })
        .eq('id', jobRow.id);

      results.push({ jobId: jobRow.id, status: 'completed' });
    } catch (err) {
      const message = (err as Error).message;
      const willRetry = jobRow.attempts < jobRow.max_attempts;

      await admin
        .from('ai_jobs')
        .update({
          status: willRetry ? 'queued' : 'failed',
          error_message: message,
          finished_at: willRetry ? null : new Date().toISOString(),
        })
        .eq('id', jobRow.id);

      results.push({ jobId: jobRow.id, status: willRetry ? 'requeued' : 'failed', error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
