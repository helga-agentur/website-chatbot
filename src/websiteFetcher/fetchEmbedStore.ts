import OpenAI from 'openai'
import { Crawler, extractContent, type HandleSuccessParams } from 'scrapino';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import createChromaClient from '../shared/createChromaClient.js';
import getOrCreateCollection from '../shared/getOrCreateChromaCollection.js';
import addWebsiteChunksToChroma from './addWebsiteChunksToChroma.js';

/**
 * The main file to fetch content from a website, convert and store it in Chroma:
 * - Reads env variables
 * - Sets up the clients we need (OpenAI, Chroma)
 * - Starts the crawler
 * - Handles the crawler's output by extracting content, splitting it and adding it to Chroma
 *
 * Writes some logs, but just the ones needed for debugging.
 */
export default async (): Promise<void> => {
  const envVariablesMap = {
    baseUrl: 'WEBSITE_BASE_URL',
    openAIAPIKey: 'OPENAI_API_KEY',
    jinaAPIKey: 'JINA_API_KEY',
    chromaCollectionName: 'CHROMA_COLLECTION_NAME',
    chromaURL: 'CHROMA_URL',
  };
  const envVariables = [...Object.entries(envVariablesMap)]
    .map(([key, envName]): [string, string] => {
      const value = process.env[envName];
      if (!value) {
        throw new Error(`Environment variable ${envName} is not set`);
      }
      return [key, value];
    });
  const keys = Object.fromEntries(envVariables);

  // Setup the basic libraries we need
  const openAIClient = new OpenAI();
  const chromaClient = createChromaClient({ chromaURL: keys.chromaURL });
  const chromaCollection = await getOrCreateCollection({
    chromaClient,
    collectionName: keys.chromaCollectionName,
  });
  const splitterOptions = {
    chunkOverlap: 120,
    chunkSize: 500,
  };
  const splitter = new MarkdownTextSplitter(splitterOptions);

  let currentDocumentNumber = 0;

  /**
   * Handles a document after it has been fetched: Extracts content (markdown), splits it into
   * chunks and adds it to Chroma.
   */
  const handleDocument = async ({ content, url, mimeType }: HandleSuccessParams): Promise<void> => {
    const { markdownContent, date } = await extractContent({
      content,
      mimeType,
      url,
      jinaAPIKey: keys.jinaAPIKey,
      openAIAPIKey: keys.openAIAPIKey,
    });
    console.log('\n--- %d ---\n%s', currentDocumentNumber += 1, new Date().toISOString());
    console.log('Handle %s, created on %s', url, date);

    const chunks = await splitter.splitText(markdownContent);
    console.log('Split into %d chunks', chunks.length);
    await addWebsiteChunksToChroma({
      collection: chromaCollection,
      chunks,
      url,
      date,
      openAIClient,
    });
  };

  const crawler = new Crawler({
    entryPointURL: keys.baseUrl,
    guardrail: [keys.baseUrl],
    // eslint-disable-next-line no-void
    handleDocument: (...args): void => void handleDocument(...args),
    handleError: (error: Error): void => {
      console.error('Failed: %o', error);
    },
    logFunction: (): void => {},
  });
  crawler.crawl();
};
