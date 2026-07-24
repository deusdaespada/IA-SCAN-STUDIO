'use client';

import * as React from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface OcrElementWithRelations {
  id: string;
  bbox_x: number;
  bbox_y: number;
  bbox_width: number;
  bbox_height: number;
  original_text: string;
  element_type: string;
  translations: { id: string; translated_text: string; is_current: boolean }[];
  typesetting: { pos_x: number; pos_y: number; width: number; height: number; font_size: number; font_family: string; color: string; text_align: string }[];
}

interface PageRow {
  id: string;
  original_image_url: string;
  clean_image_url: string | null;
  final_image_url: string | null;
  width: number | null;
  height: number | null;
}

export function PageEditorCanvas({ page, elements }: { page: PageRow; elements: OcrElementWithRelations[] }) {
  const [showOriginal, setShowOriginal] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [editedTexts, setEditedTexts] = React.useState<Record<string, string>>({});
  const supabase = createClient();

  const imageUrl = showOriginal ? page.original_image_url : page.final_image_url || page.clean_image_url || page.original_image_url;

  async function saveEdit(ocrResultId: string, translationId: string | undefined, text: string) {
    if (!translationId) return;
    await supabase.from('translations').update({ translated_text: text }).eq('id', translationId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-white/80">Editor de página</h2>
        <button
          onClick={() => setShowOriginal((v) => !v)}
          className="rounded-md bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-accent"
        >
          {showOriginal ? 'Ver resultado' : 'Ver original'}
        </button>
      </div>

      <div className="relative mx-auto w-fit">
        <Image
          src={imageUrl}
          alt="Página"
          width={page.width || 900}
          height={page.height || 1300}
          className="max-h-[85vh] w-auto rounded-md border border-border"
        />
        {!showOriginal &&
          elements.map((el) => {
            const currentTranslation = el.translations?.find((t) => t.is_current);
            const ts = el.typesetting?.[0];
            const left = ((ts?.pos_x ?? el.bbox_x) / (page.width || 900)) * 100;
            const top = ((ts?.pos_y ?? el.bbox_y) / (page.height || 1300)) * 100;
            const width = ((ts?.width ?? el.bbox_width) / (page.width || 900)) * 100;
            const height = ((ts?.height ?? el.bbox_height) / (page.height || 1300)) * 100;

            return (
              <div
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, fontSize: ts?.font_size ?? 14 }}
                className={cn(
                  'absolute flex cursor-pointer items-center justify-center border-2 border-dashed p-1 text-center leading-tight',
                  selectedId === el.id ? 'border-primary bg-primary/10' : 'border-transparent hover:border-primary/50'
                )}
              >
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => saveEdit(el.id, currentTranslation?.id, e.currentTarget.textContent || '')}
                  className="w-full outline-none"
                  style={{ color: ts?.color ?? '#000', textAlign: (ts?.text_align as 'left' | 'center' | 'right') ?? 'center' }}
                >
                  {editedTexts[el.id] ?? currentTranslation?.translated_text ?? '(sem tradução)'}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
