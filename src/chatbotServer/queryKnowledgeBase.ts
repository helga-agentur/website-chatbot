import { Collection } from 'chromadb';

type QueryResponse = Awaited<ReturnType<Collection['query']>>;

/**
 * Takes the input question and queries the knowledge base.
 */
export default async ({
  embeddedQuery,
  chromaCollection,
  amountOfResults = 50,
}: {
  embeddedQuery: number[],
  chromaCollection: Collection,
  amountOfResults?: number,
}): Promise<QueryResponse> => {
  const result = await chromaCollection.query({
    queryEmbeddings: [embeddedQuery],
    nResults: amountOfResults,
  });
  return result;
};
