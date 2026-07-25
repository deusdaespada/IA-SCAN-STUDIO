export interface FetchedImage {
  base64: string;
  mimeType: string;
}

const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export async function fetchImageAsBase64(imageUrl: string): Promise<FetchedImage> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Falha ao baixar imagem da página (${res.status}): ${imageUrl}`);
  }

  let mimeType = res.headers.get('content-type') || 'image/png';
  mimeType = mimeType.split(';')[0].trim();

  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    // fallback por extensão, caso o header content-type venha genérico (ex: application/octet-stream)
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
    const byExt: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
    mimeType = byExt[ext ?? ''] || 'image/png';
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return { base64, mimeType };
}
