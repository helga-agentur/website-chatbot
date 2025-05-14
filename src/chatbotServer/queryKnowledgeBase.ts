import { Collection, QueryResponse } from 'chromadb';

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
