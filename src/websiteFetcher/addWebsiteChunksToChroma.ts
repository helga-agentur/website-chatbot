import { OpenAI } from 'openai';
import { Collection } from 'chromadb';
import getEmbeddings from '../shared/getEmbeddings.js';

/**
 * Takes chunks (splitted content) of a website and adds them to a Chroma collection; the chunks
 * share the same URL and Date, the function must therefore be called once per website page.
 */
export default async ({
  collection,
  chunks,
  url,
  date,
  openAIClient,
}: {
  collection: Collection,
  chunks: string[],
  url: string,
  date: string | null,
  openAIClient: OpenAI
}): Promise<void> => {
  const embeddings = await getEmbeddings({ openAIClient, content: chunks });
  // Chroma does not like null as a date; map to a string if the date the website was published
  // is not known.
  const dateForChroma = date ?? '';
  await collection.add({
    ids: chunks.map((_, index): string => `${btoa(url)}-${index.toString()}`),
    embeddings,
    documents: chunks,
    metadatas: chunks.map((): { source: string, date: string } => (
      { source: url, date: dateForChroma }
    )),
  });
  console.log('Added %d chunks to chroma collection "%s"', chunks.length, collection.name);
};
