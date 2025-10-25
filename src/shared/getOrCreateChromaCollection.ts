import { ChromaClient, Collection } from 'chromadb';

/**
 * Guess whuat: Gets a Chroma collection if it exists, otherwise creates and returns it.
 * @param deleteExistingCollection: If true, the collection will be deleted before a new one is
 * created. Needed e.g. for content rotation (with a green/blue deployment strategy, the previous
 * collection will be deleted on every 2nd fetch).
 */
export default async ({
  chromaClient,
  collectionName,
  deleteExistingCollection = false,
}: {
  chromaClient: ChromaClient,
  collectionName: string,
  deleteExistingCollection?: boolean,
}): Promise<Collection> => {
  if (deleteExistingCollection) {
    console.log('Deleting existing collection %s (if it exsists)', collectionName);
    await chromaClient.deleteCollection({ name: collectionName });
  }
  return chromaClient.getOrCreateCollection({ name: collectionName });
};
