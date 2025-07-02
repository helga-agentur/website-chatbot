import { Collection } from 'chromadb';

type QueryResponse = Awaited<ReturnType<Collection['query']>>;

/**
 * Chroma returns structured data; we need it in a simple text form in order to pass it to the LLM.
 * Convert it.
 */
export default ({
  context,
}: {
  context: QueryResponse,
}): string => {
  const amountOfDocuments = context.documents[0]?.length ?? 0;
  const documents = Array.from({ length: amountOfDocuments })
    .map((_, index): string => {
      // That is complicated, but just what TS tells us QueryResponse can contain as a data
      // structure 🤷‍♂️
      const meta = Array.isArray(context.metadatas[0]) ? context.metadatas[0][index] : {};
      return `
        Text: ${context.documents[0]?.[index] ?? ''} \n 
        (Source: ${meta?.source?.toString() || ''})\n
        (Guessed publication date: ${meta?.date?.toString() || ''})
      `;
    });
  return documents.join('\n\n---\n\n');
};
