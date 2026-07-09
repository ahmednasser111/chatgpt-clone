export interface ChunkOptions {
  size?: number;
  overlap?: number;
}

/** Sliding-window text splitter that prefers paragraph boundaries, falling back to a raw character window. */
export function chunkText(text: string, { size = 1000, overlap = 150 }: ChunkOptions = {}): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= size) return [normalized];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= size) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);

    if (paragraph.length <= size) {
      current = paragraph;
    } else {
      // Paragraph itself is too long — fall back to a raw character window.
      for (let start = 0; start < paragraph.length; start += size - overlap) {
        chunks.push(paragraph.slice(start, start + size));
      }
      current = "";
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
