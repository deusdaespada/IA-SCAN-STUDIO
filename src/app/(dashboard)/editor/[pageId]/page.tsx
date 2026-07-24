import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageEditorCanvas } from '@/components/editor/page-editor-canvas';
import { QcPanel } from '@/components/qc/qc-panel';

export default async function EditorPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase.from('pages').select('*').eq('id', pageId).single();
  if (!page) notFound();

  const { data: ocrResults } = await supabase
    .from('ocr_results')
    .select('*, translations(id, translated_text, is_current), typesetting(*)')
    .eq('page_id', pageId)
    .order('order_index', { ascending: true });

  const { data: qcResults } = await supabase.from('qc_results').select('*').eq('page_id', pageId).order('created_at', { ascending: false });

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-auto bg-black/40 p-6">
        <PageEditorCanvas page={page} elements={ocrResults ?? []} />
      </div>
      <div className="w-80 overflow-y-auto border-l border-border bg-card">
        <QcPanel pageId={pageId} results={qcResults ?? []} />
      </div>
    </div>
  );
}
