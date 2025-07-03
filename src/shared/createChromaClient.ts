import { ChromaClient } from 'chromadb';

/**
 * Just exposes a chroma client; handled centrally if we need to update (shared) config.
 */
export default ({
  chromaURL,
}: {
  chromaURL: string;
}): ChromaClient => (
  new ChromaClient({ path: chromaURL })
);
