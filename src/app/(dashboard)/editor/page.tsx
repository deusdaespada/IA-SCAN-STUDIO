import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export default async function EditorIndexPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from('pages')
    .select('id, page_number, original_image_url, clean_image_url, chapters(number, projects(name))')
    .order('created_at', { ascending: false })
    .limit(24);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Editor</h1>
        <p className="text-muted-foreground">Selecione uma página recente para editar, ou abra pelo pipeline de um capítulo</p>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {pages?.map((p) => {
          const chapter = p.chapters as unknown as { number: number; projects: { name: string } };
          return (
            <Link key={p.id} href={`/editor/${p.id}`} className="group">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-secondary">
                <Image src={p.clean_image_url || p.original_image_url} alt={`Página ${p.page_number}`} fill className="object-cover transition-transform group-hover:scale-105" />
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{chapter?.projects?.name} — Cap. {chapter?.number} · Pág. {p.page_number}</p>
            </Link>
          );
        })}
        {(!pages || pages.length === 0) && (
          <p className="col-span-full text-sm text-muted-foreground">Nenhuma página disponível ainda. Faça upload de um capítulo primeiro.</p>
        )}
      </div>
    </div>
  );
}
