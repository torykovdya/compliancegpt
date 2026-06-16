// ─── Embeddings Utility ─────────────────────────────────────────────
// Deterministic hash-based vectors (no external API needed for demo).
// Same text always produces the same vector.

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

export function generateEmbedding(text: string): number[] {
  const vec = new Array(1536).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  for (const word of words) {
    const base = hashString(word);
    for (let i = 0; i < 8; i++) {
      const idx = (base + i * 7919) % 1536;
      vec[idx] += 1 / (i + 1);
    }
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  return texts.map((t) => generateEmbedding(t));
}
