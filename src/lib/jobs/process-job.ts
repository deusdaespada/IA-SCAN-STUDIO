import { createAdminClient } from '@/lib/supabase/server';
import { resolveAiClientForUser } from '@/lib/ai/factory';
import type { AiJob } from '@/types/domain';

/**
 * Processa um único job da fila. Retorna o resultado ou lança erro (o chamador
 * é responsável por marcar o job como failed e agendar retry).
 */
export async function processJob(job: AiJob, ownerId: string) {
  const admin = createAdminClient();

  switch (job.stage) {
    case 'ocr':
      return processOcrJob(job, ownerId, admin);
    case 'translation':
      return processTranslationJob(job, ownerId, admin);
    case 'review':
      return processReviewJob(job, ownerId, admin);
    default:
      throw new Error(`Processamento automático para a etapa "${job.stage}" ainda não implementado neste worker. Implemente o handler em src/lib/jobs/process-job.ts.`);
  }
}

async function processOcrJob(job: AiJob, ownerId: string, admin: ReturnType<typeof createAdminClient>) {
  if (!job.page_id) throw new Error('Job de OCR sem page_id');

  const { data: page } = await admin.from('pages').select('id, original_image_url').eq('id', job.page_id).single();
  if (!page) throw new Error('Página não encontrada');

  const provider = job.ai_provider ?? 'anthropic';
  const model = job.ai_model ?? 'claude-sonnet-4-6';
  const client = await resolveAiClientForUser(ownerId, provider);

  const result = await client.ocr({ imageUrl: page.original_image_url }, model);

  if (result.elements.length > 0) {
    const rows = result.elements.map((el, index) => ({
      page_id: page.id,
      element_type: el.type,
      bbox_x: el.bbox.x,
      bbox_y: el.bbox.y,
      bbox_width: el.bbox.width,
      bbox_height: el.bbox.height,
      original_text: el.text,
      confidence: el.confidence,
      order_index: index,
    }));

    const { error: insertError } = await admin.from('ocr_results').insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

  await admin.from('ai_usage').insert({
    user_id: ownerId,
    project_id: job.project_id,
    ai_provider: provider,
    ai_model: model,
    operation: 'ocr',
    input_tokens: 0,
    output_tokens: 0,
  });

  await admin.from('pages').update({ current_stage: 'translation' }).eq('id', job.page_id);

  // Encadeia automaticamente o próximo job da pipeline: tradução
  await admin.from('ai_jobs').insert({
    project_id: job.project_id,
    chapter_id: job.chapter_id,
    page_id: job.page_id,
    stage: 'translation',
    status: 'queued',
    ai_provider: provider,
    ai_model: model,
  });

  return { elementsDetected: result.elements.length };
}

async function processTranslationJob(job: AiJob, ownerId: string, admin: ReturnType<typeof createAdminClient>) {
  if (!job.page_id) throw new Error('Job de tradução sem page_id');

  const { data: ocrResults } = await admin
    .from('ocr_results')
    .select('id, original_text')
    .eq('page_id', job.page_id)
    .order('order_index', { ascending: true });

  if (!ocrResults || ocrResults.length === 0) {
    return { skipped: true, reason: 'Nenhum resultado de OCR encontrado para esta página' };
  }

  const { data: glossary } = await admin
    .from('glossaries')
    .select('term_original, term_translated, category')
    .eq('project_id', job.project_id);

  const provider = job.ai_provider ?? 'anthropic';
  const model = job.ai_model ?? 'claude-sonnet-4-6';
  const client = await resolveAiClientForUser(ownerId, provider);

  const { data: project } = await admin.from('projects').select('source_language, target_language').eq('id', job.project_id).single();

  const result = await client.translate(
    {
      texts: ocrResults.map((o) => ({ id: o.id, text: o.original_text })),
      context: {
        sourceLanguage: project?.source_language ?? 'ja',
        targetLanguage: project?.target_language ?? 'pt-BR',
        glossary: glossary ?? [],
      },
    },
    model
  );

  for (const t of result.translations) {
    await admin.from('translations').insert({
      ocr_result_id: t.id,
      translated_text: t.translated,
      ai_provider: provider,
      ai_model: model,
      tokens_used: Math.round(result.tokensUsed / result.translations.length),
      is_current: true,
    });
  }

  await admin.from('ai_usage').insert({
    user_id: ownerId,
    project_id: job.project_id,
    ai_provider: provider,
    ai_model: model,
    operation: 'translation',
    input_tokens: result.tokensUsed,
    output_tokens: 0,
  });

  await admin.rpc('increment_ai_tokens_used', { p_user_id: ownerId, p_tokens: result.tokensUsed });
  await admin.from('pages').update({ current_stage: 'review' }).eq('id', job.page_id);

  await admin.from('ai_jobs').insert({
    project_id: job.project_id,
    chapter_id: job.chapter_id,
    page_id: job.page_id,
    stage: 'review',
    status: 'queued',
    ai_provider: provider,
    ai_model: model,
  });

  return { translatedCount: result.translations.length, tokensUsed: result.tokensUsed };
}

async function processReviewJob(job: AiJob, ownerId: string, admin: ReturnType<typeof createAdminClient>) {
  if (!job.page_id) throw new Error('Job de revisão sem page_id');

  const { data: translations } = await admin
    .from('translations')
    .select('id, translated_text, ocr_result_id, ocr_results!inner(original_text, page_id)')
    .eq('is_current', true)
    .eq('ocr_results.page_id', job.page_id);

  if (!translations || translations.length === 0) {
    return { skipped: true, reason: 'Nenhuma tradução encontrada para revisar' };
  }

  const { data: project } = await admin.from('projects').select('source_language, target_language').eq('id', job.project_id).single();
  const provider = job.ai_provider ?? 'anthropic';
  const model = job.ai_model ?? 'claude-sonnet-4-6';
  const client = await resolveAiClientForUser(ownerId, provider);

  let totalTokens = 0;
  for (const t of translations) {
    const ocr = (t as unknown as { ocr_results: { original_text: string } }).ocr_results;
    const result = await client.review(
      {
        original: ocr.original_text,
        translated: t.translated_text,
        context: { sourceLanguage: project?.source_language ?? 'ja', targetLanguage: project?.target_language ?? 'pt-BR', glossary: [] },
      },
      model
    );
    totalTokens += result.tokensUsed;

    await admin.from('reviews').insert({
      translation_id: t.id,
      suggested_text: result.suggestion,
      reasoning: result.reasoning,
      status: 'pending',
    });
  }

  await admin.rpc('increment_ai_tokens_used', { p_user_id: ownerId, p_tokens: totalTokens });
  await admin.from('pages').update({ current_stage: 'clean_redraw' }).eq('id', job.page_id);

  return { reviewedCount: translations.length, tokensUsed: totalTokens };
}
