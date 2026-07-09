import { AiServiceError } from "../errors";

const EMBEDDING_MODEL = "nomic-embed-text";

/** Embeds text via a local Ollama instance for RAG retrieval. */
export async function embed(text: string): Promise<number[]> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    });
  } catch {
    throw new AiServiceError(
      "NETWORK_ERROR",
      `Could not reach Ollama at ${baseUrl}. Make sure it's running (\`ollama serve\`).`,
      0,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    if (response.status === 404 || /model.*not found/i.test(body)) {
      throw new AiServiceError(
        "UNSUPPORTED_MODEL",
        `Ollama doesn't have "${EMBEDDING_MODEL}" pulled. Run \`ollama pull ${EMBEDDING_MODEL}\`.`,
        response.status,
      );
    }
    throw new AiServiceError("UNKNOWN", `Ollama embeddings error (${response.status}): ${body.slice(0, 300)}`, response.status);
  }

  const data = await response.json();
  const vector: unknown = data?.embeddings?.[0] ?? data?.embedding;
  if (!Array.isArray(vector)) {
    throw new AiServiceError("UNKNOWN", "Ollama returned an unexpected embeddings response shape.", 502);
  }
  return vector;
}
