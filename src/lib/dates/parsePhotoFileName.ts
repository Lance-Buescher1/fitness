const IMG_RE = /^IMG_(\d{4})(\d{2})(\d{2})\./i;

export function parsePhotoIsoDateFromFileName(fileName: string): string | null {
  const m = fileName.match(IMG_RE);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${mo}-${d}`;
}
