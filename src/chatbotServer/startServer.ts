import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { OpenAI } from 'openai';
import createChromaClient from '../shared/createChromaClient.js';
import getOrCreateChromaCollection from '../shared/getOrCreateChromaCollection.js';
import answerQuestion from './answerQuestion.js';
import type { HistoryEntry } from './types';
import log from '../shared/log.js';

/**
 * This is the main file to start the chatbot server:
 * - Reads env variables
 * - Sets up the fat clients we need everywhere (make sure to start them outside of the request/
 *   response cycle to speed up things)
 * - Starts the server and provides the routs needed
 */
export default async (): Promise<void> => {
  const envVariablesMap = {
    openAIAPIKey: 'OPENAI_API_KEY',
    chromaCollectionName: 'CHROMA_COLLECTION_NAME',
    chromaURL: 'CHROMA_URL',
    serverPort: 'SERVER_PORT',
    serverHost: 'SERVER_HOST',
    serveFrontend: 'EXPOSE_FRONTEND_REFERENCE_IMPLEMENTATION',
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

  // Initialize clients early to share them across all requests (that saves us tons of memory)
  const chromaClient = createChromaClient({ chromaURL: keys.chromaURL });
  const chromaCollection = await getOrCreateChromaCollection({
    chromaClient,
    collectionName: keys.chromaCollectionName,
  });
  const openAIClient = new OpenAI({
    apiKey: keys.openAIAPIKey,
  });

  const app = express();
  const basePath = dirname(fileURLToPath(new URL(import.meta.url)));

  // Provide a simple, dumb but well working frontend to test the API; .env provides the value
  // as a string.
  if (keys.serveFrontend === 'true') {
    app.use('/', express.static(join(basePath, '../../frontend')));
  }

  app.use(express.json());

  app.post('/chat', async (request, response): Promise<void> => {
    const requestReceivedAt = new Date().getTime();
    // Use an unqiue ID per request across all logs to know which request the collected data
    // belongs to
    const requestID = randomUUID();

    type Body = { question: string; history?: HistoryEntry[] };
    const body = request.body as Body;
    log({ requestID, message: `Request received; body is ${JSON.stringify(body)}` });

    // It's mandatory to parse the request properly as we pass it around afterwards.
    if (!body.question) {
      response.status(400).send('Required field "question" is missing');
    }
    const { question } = body;

    // Validate / whiteliste input strictly: We'll directly pass it to OpenAI
    let history: HistoryEntry[] = [];
    const isValidHistoryEntry = ({ role, message }: { role: string, message: string }): boolean => (
      (role === 'user' || role === 'assistant') && typeof message === 'string'
    );
    if (body.history) {
      // Log invalid history, but do not fail; they're not crucial and good UX is forgiving
      if (!Array.isArray(body.history)) {
        log({
          requestID,
          message: `Invalid history type; expected array, got ${typeof body.history}`,
          level: 'error',
        });
      }
      history = body.history.filter(isValidHistoryEntry);
      const invalidEntries = body.history.filter((item): boolean => !isValidHistoryEntry(item));
      // Don't fail if only some entries are invalid
      if (invalidEntries.length > 0) {
        log({
          requestID,
          message: `Invalid history entries: ${JSON.stringify(invalidEntries)}`,
          level: 'error',
        });
      }
    }

    response.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    });

    try {
      const streamingAnswer = await answerQuestion({
        question,
        history,
        openAIClient,
        chromaCollection,
        requestID,
      });
      const answerChunks: string[] = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const event of streamingAnswer) {
        const content = event.choices[0]?.delta?.content || '';
        response.write(content);
        answerChunks.push(content);
      }
      log({
        requestID,
        message: `The returned response is ${JSON.stringify(answerChunks.join(''))}`,
      });
      log({
        requestID,
        message: `The whole response took ${(new Date().getTime() - requestReceivedAt).toString()} ms.`,
      });
      response.end();
    } catch (err) {
      log({ requestID, message: String(err), level: 'error' });
      // Don't expose our errors, they may be sensitive
      response.status(500).send(`Error generating completion; check server logs for request with ID ${requestID}.`);
    }
  });

  app.listen(parseInt(keys.serverPort, 10), keys.serverHost, (): void => {
    console.log(`Chatbot running on http://${keys.serverHost}:${keys.serverPort}`);
  });
};
