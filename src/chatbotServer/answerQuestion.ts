import { Collection } from 'chromadb';
import Anthropic from '@anthropic-ai/sdk';
import queryKnowledgeBase from './queryKnowledgeBase.js';
import getEmbeddings from '../shared/getEmbeddings.js';
import convertContextToText from './convertContextToText.js';
import createCompletion from './createCompletion.js';
import type { HistoryEntry } from './types';
import log from '../shared/log.js';

/**
 * Does basically everything needed once we get a question as input
 */
export default async ({
  question,
  completionsClient,
  jinaApiKey,
  history,
  chromaCollection,
  requestID,
}: {
  question: string;
  completionsClient: Anthropic;
  jinaApiKey: string;
  history: HistoryEntry[];
  chromaCollection: Collection;
  requestID: string;
}): Promise<AsyncGenerator<string>> => {
  const beforeEmbedding = new Date().getTime();

  const [embeddedQuestion] = await getEmbeddings({
    jinaApiKey,
    content: [question],
    task: 'retrieval.query',
  });
  const afterEmbedding = new Date().getTime();
  log({
    requestID,
    message: `Embedding the question took ${(afterEmbedding - beforeEmbedding).toString()} ms.`,
  });

  const context = await queryKnowledgeBase({
    embeddedQuery: embeddedQuestion,
    chromaCollection,
  });
  const contextAsText = convertContextToText({ context });
  const afterQuery = new Date().getTime();
  log({
    requestID,
    message: `Querying chroma for context took ${(afterQuery - afterEmbedding).toString()} ms.`,
  });
  log({
    requestID,
    message: `Context is ${JSON.stringify(contextAsText)}`,
  });

  const streamingAnswer = await createCompletion({
    question,
    contextAsText,
    history,
    completionsClient,
  });
  const afterAnswer = new Date().getTime();
  log({
    requestID,
    message: `Creating the completion took ${(afterAnswer - afterQuery).toString()} ms.`,
  });
  log({
    requestID,
    message: `Answer started streaming after ${(new Date().getTime() - beforeEmbedding).toString()} ms.`,
  });

  return streamingAnswer;
};
