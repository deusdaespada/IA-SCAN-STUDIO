import JSZip from 'jszip';

export interface ExtractedPage {
  filename: string;
  buffer: Buffer;
  mimeType: string;
}

const IMAGE_EXTENSIONS: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Extrai imagens de um arquivo ZIP ou CBZ (que é apenas um ZIP renomeado).
 * CBR (RAR) não é suportado nativamente em Node sem uma dependência nativa —
 * nesse caso orientamos o usuário a re-empacotar como CBZ/ZIP.
 */
export async function extractZipPages(fileBuffer: Buffer): Promise<ExtractedPage[]> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const entries = Object.values(zip.files).filter((f) => !f.dir);

  const pages: ExtractedPage[] = [];
  for (const entry of entries) {
    const ext = entry.name.split('.').pop()?.toLowerCase() ?? '';
    if (!(ext in IMAGE_EXTENSIONS)) continue;
    const buffer = await entry.async('nodebuffer');
    pages.push({ filename: entry.name, buffer, mimeType: IMAGE_EXTENSIONS[ext] });
  }

  return sortPagesNaturally(pages);
}

/**
 * Ordena páginas "naturalmente" (001, 002, ..., 010 em vez de ordem alfabética pura
 * que colocaria "10" antes de "2").
 */
export function sortPagesNaturally(pages: ExtractedPage[]): ExtractedPage[] {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  return [...pages].sort((a, b) => collator.compare(a.filename, b.filename));
}

export function detectFormat(filename: string): 'zip' | 'cbz' | 'cbr' | 'pdf' | 'image' | 'unsupported' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'zip') return 'zip';
  if (ext === 'cbz') return 'cbz';
  if (ext === 'cbr') return 'cbr';
  if (ext === 'pdf') return 'pdf';
  if (ext in IMAGE_EXTENSIONS) return 'image';
  return 'unsupported';
}
