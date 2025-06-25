import { Collection } from 'chromadb';
import OpenAI from 'openai';
import queryKnowledgeBase from './queryKnowledgeBase.js';
import getEmbeddings from '../shared/getEmbeddings.js';
import convertContextToText from './convertContextToText.js';
import generateSearchTerms from './generateSearchTerms.js';
import createCompletion from './createCompletion.js';
import type { HistoryEntry } from './types';

/**
 * Does basically everything needed once we get a question as input
 */
export default async ({
  question,
  openAIClient,
  history,
  chromaCollection,
  improveSearchTerms = false,
}: {
  question: string;
  openAIClient: OpenAI;
  history: HistoryEntry[];
  chromaCollection: Collection;
  improveSearchTerms?: boolean,
}): Promise<AsyncIterable<OpenAI.ChatCompletionChunk>> => {
  const beforeSearchTerms = new Date().getTime();

  // That is a nice feature – but it costs between 500 and 1000ms. Don't use it for the moment.
  const searchTerms = !improveSearchTerms
    ? [question]
    : [question, ...await generateSearchTerms({ openAIClient, question })];

  console.log('Search terms are', searchTerms);
  const beforeEmbedding = new Date().getTime();
  console.log('Search terms took %d ms', (beforeEmbedding - beforeSearchTerms));

  const [embeddedQuestion] = await getEmbeddings({
    openAIClient,
    content: [question, ...searchTerms],
  });
  const afterEmbedding = new Date().getTime();
  console.log('Embedding took %d ms', (afterEmbedding - beforeEmbedding));

  const context = await queryKnowledgeBase({
    embeddedQuery: embeddedQuestion,
    chromaCollection,
  });
  const contextAsText = convertContextToText({ context });
  const afterQuery = new Date().getTime();
  console.log('Query took %d ms', (afterQuery - afterEmbedding));
  console.log('Context is', contextAsText);

  const streamingAnswer = await createCompletion({
    question,
    contextAsText,
    history,
    openAIClient,
  });
  const afterAnswer = new Date().getTime();
  console.log('Completion took %d ms', (afterAnswer - afterQuery));
  console.log('Response after', new Date().getTime() - beforeEmbedding, 'ms');

  return streamingAnswer;
};
