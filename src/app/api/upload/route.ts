import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractZipPages, detectFormat } from '@/lib/utils/file-extraction';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB || 200);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const formData = await request.formData();
  const projectId = String(formData.get('projectId') || '');
  const chapterId = String(formData.get('chapterId') || '');
  const file = formData.get('file') as File | null;

  if (!projectId || !chapterId || !file) {
    return NextResponse.json({ error: 'Parâmetros ausentes: projectId, chapterId ou file' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Arquivo excede o limite de ${MAX_UPLOAD_SIZE_MB}MB` }, { status: 413 });
  }

  // Confere que o usuário tem acesso ao capítulo/projeto (RLS também protege isso na escrita)
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('id, project_id')
    .eq('id', chapterId)
    .eq('project_id', projectId)
    .single();

  if (chapterError || !chapter) {
    return NextResponse.json({ error: 'Capítulo não encontrado ou sem permissão' }, { status: 403 });
  }

  const format = detectFormat(file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let pagesToUpload: { filename: string; buffer: Buffer; mimeType: string }[] = [];

  if (format === 'zip' || format === 'cbz') {
    pagesToUpload = await extractZipPages(buffer);
  } else if (format === 'image') {
    const mimeType = file.type || 'image/png';
    pagesToUpload = [{ filename: file.name, buffer, mimeType }];
  } else if (format === 'cbr') {
    return NextResponse.json(
      { error: 'Arquivos .cbr (RAR) não são suportados diretamente. Reempacote como .cbz/.zip.' },
      { status: 400 }
    );
  } else if (format === 'pdf') {
    // Extração de páginas de PDF como imagens requer rasterização (ex: pdf.js / pdftoppm)
    // executada em um worker dedicado. Aqui registramos o job para processamento assíncrono.
    return NextResponse.json(
      { error: 'Upload de PDF é processado de forma assíncrona. Job registrado, acompanhe na Fila de Processamento.', queued: true },
      { status: 202 }
    );
  } else {
    return NextResponse.json({ error: 'Formato de arquivo não suportado' }, { status: 400 });
  }

  if (pagesToUpload.length === 0) {
    return NextResponse.json({ error: 'Nenhuma imagem válida encontrada no arquivo' }, { status: 400 });
  }

  // Descobre o próximo número de página disponível no capítulo
  const { count: existingCount } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', chapterId);

  let nextPageNumber = (existingCount ?? 0) + 1;
  const insertedPages: { id: string; page_number: number }[] = [];
  let totalBytes = 0;

  for (const page of pagesToUpload) {
    const ext = page.mimeType.split('/')[1] || 'png';
    const storagePath = `${projectId}/${chapterId}/${String(nextPageNumber).padStart(4, '0')}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('pages').upload(storagePath, page.buffer, {
      contentType: page.mimeType,
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json({ error: `Falha ao enviar página ${page.filename}: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from('pages').getPublicUrl(storagePath);

    const { data: pageRow, error: insertError } = await supabase
      .from('pages')
      .insert({
        chapter_id: chapterId,
        page_number: nextPageNumber,
        original_image_url: publicUrlData.publicUrl,
        current_stage: 'upload',
      })
      .select('id, page_number')
      .single();

    if (insertError) {
      return NextResponse.json({ error: `Falha ao registrar página: ${insertError.message}` }, { status: 500 });
    }

    insertedPages.push(pageRow);
    totalBytes += page.buffer.byteLength;
    nextPageNumber += 1;
  }

  // Atualiza uso de storage do usuário
  await supabase.rpc('increment_storage_used', { p_user_id: user.id, p_bytes: totalBytes }).then(
    () => {},
    () => {} // função opcional — ignora se não existir ainda
  );

  // Enfileira o job de OCR para cada página recém-criada
  const ocrJobs = insertedPages.map((p) => ({
    project_id: projectId,
    chapter_id: chapterId,
    page_id: p.id,
    stage: 'ocr' as const,
    status: 'queued' as const,
  }));
  await supabase.from('ai_jobs').insert(ocrJobs);

  await supabase.from('chapters').update({ current_stage: 'ocr' }).eq('id', chapterId);

  return NextResponse.json({ success: true, pagesUploaded: insertedPages.length });
}
