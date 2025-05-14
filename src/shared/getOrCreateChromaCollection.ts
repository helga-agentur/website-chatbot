import { ChromaClient, Collection } from 'chromadb';

/**
 * Guess whuat: Gets a Chroma collection if it exists, otherwise creates and returns it.
 */
export default ({
  chromaClient,
  collectionName,
}: {
  chromaClient: ChromaClient,
  collectionName: string,
}): Promise<Collection> => (
  chromaClient.getOrCreateCollection({ name: collectionName })
);
