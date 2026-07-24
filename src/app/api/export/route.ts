import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { projectId, chapterId, format = 'cbz', scope = 'chapter' } = await request.json();

  if (!['zip', 'cbz'].includes(format)) {
    return NextResponse.json({ error: 'Este endpoint gera zip/cbz diretamente. PDF/PNG/JPG/WEBP são processados via job assíncrono (ver ai_jobs stage=export).' }, { status: 400 });
  }

  const { data: exportRow, error: exportError } = await supabase
    .from('exports')
    .insert({ project_id: projectId, chapter_id: scope === 'chapter' ? chapterId : null, format, scope, status: 'processing', requested_by: user.id })
    .select('id')
    .single();

  if (exportError) return NextResponse.json({ error: exportError.message }, { status: 500 });

  try {
    let chapterIds: string[] = [];
    if (scope === 'chapter') {
      chapterIds = [chapterId];
    } else {
      const { data: chapters } = await supabase.from('chapters').select('id').eq('project_id', projectId).order('number');
      chapterIds = (chapters ?? []).map((c) => c.id);
    }

    const zip = new JSZip();

    for (const chId of chapterIds) {
      const { data: chapter } = await supabase.from('chapters').select('number, title').eq('id', chId).single();
      const { data: pages } = await supabase
        .from('pages')
        .select('page_number, final_image_url, clean_image_url, original_image_url')
        .eq('chapter_id', chId)
        .order('page_number', { ascending: true });

      const folder = scope === 'project' ? zip.folder(`Capitulo_${chapter?.number}`) : zip;

      for (const p of pages ?? []) {
        const url = p.final_image_url || p.clean_image_url || p.original_image_url;
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const ext = url.split('.').pop()?.split('?')[0] || 'png';
        folder?.file(`${String(p.page_number).padStart(4, '0')}.${ext}`, buffer);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const storagePath = `${projectId}/${exportRow.id}.${format}`;

    const { error: uploadError } = await supabase.storage.from('exports').upload(storagePath, zipBuffer, {
      contentType: 'application/zip',
      upsert: true,
    });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = await supabase.storage.from('exports').createSignedUrl(storagePath, 60 * 60 * 24);

    await supabase
      .from('exports')
      .update({ status: 'completed', file_url: urlData?.signedUrl, file_size_bytes: zipBuffer.byteLength, finished_at: new Date().toISOString() })
      .eq('id', exportRow.id);

    return NextResponse.json({ success: true, exportId: exportRow.id, fileUrl: urlData?.signedUrl });
  } catch (err) {
    await supabase.from('exports').update({ status: 'failed' }).eq('id', exportRow.id);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
