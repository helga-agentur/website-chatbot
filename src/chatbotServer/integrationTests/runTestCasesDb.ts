/**
 * DB-backed integration test runner for chatbot prompt quality.
 *
 * Runs test cases through the full RAG pipeline (real Chroma DB + Jina embeddings)
 * against vsao-bern.ch content. Requires a populated Chroma collection.
 *
 * Run with: npm run eval:vsao
 */
/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { parse } from 'csv-parse/sync';
import Anthropic from '@anthropic-ai/sdk';
import { ChromaClient, Collection } from 'chromadb';
import createChromaClient from '../../shared/createChromaClient.js';
import getOrCreateChromaCollection from '../../shared/getOrCreateChromaCollection.js';
import answerQuestion from '../answerQuestion.js';
import {
  TestCase, TestResult, collectStream, assessQuality, writeResults, averageScore,
} from './testUtils.js';

// Compiled JS runs from dist/, but test files live in src/
const currentDir = dirname(fileURLToPath(import.meta.url)).replace('/dist/', '/src/');

/**
 * All environment variables required by this runner.
 */
interface Env {
  anthropicApiKey: string;
  jinaApiKey: string;
  chromaCollectionName: string;
  chromaURL: string;
}

/**
 * Reads required env variables, exiting early with a clear message if any are missing.
 */
function loadEnv(): Env {
  const vars = {
    anthropicApiKey: 'ANTHROPIC_API_KEY',
    jinaApiKey: 'JINA_API_KEY',
    chromaCollectionName: 'CHROMA_COLLECTION_NAME',
    chromaURL: 'CHROMA_URL',
  } as const;

  return Object.fromEntries(
    Object.entries(vars).map(([key, envName]) => {
      const value = process.env[envName];
      if (!value) { console.error(`Required env variable ${envName} is not set`); process.exit(1); }
      return [key, value];
    }),
  ) as unknown as Env;
}

/**
 * Creates the Anthropic and Chroma clients needed to run the full RAG pipeline.
 */
async function setupClients(env: Env): Promise<{ completionsClient: Anthropic; chromaCollection: Collection }> {
  const completionsClient = new Anthropic({ apiKey: env.anthropicApiKey });
  const chromaClient: ChromaClient = createChromaClient({ chromaURL: env.chromaURL });
  const chromaCollection = await getOrCreateChromaCollection({
    chromaClient,
    collectionName: env.chromaCollectionName,
  });
  return { completionsClient, chromaCollection };
}

function loadTestCases(inputPath: string): TestCase[] {
  return parse(readFileSync(inputPath, 'utf-8'), { columns: true, skip_empty_lines: true });
}

/**
 * Runs a single test case through the full RAG pipeline and scores the result.
 * Each call generates a fresh requestID so logs are traceable per test case.
 */
async function runTestCase(
  testCase: TestCase,
  completionsClient: Anthropic,
  chromaCollection: Collection,
  jinaApiKey: string,
): Promise<TestResult> {
  const stream = await answerQuestion({
    question: testCase.userInput,
    history: [],
    completionsClient,
    jinaApiKey,
    chromaCollection,
    requestID: randomUUID(),
  });
  const actualOutput = await collectStream(stream);
  const qualityScore = await assessQuality(completionsClient, testCase.userInput, testCase.expectedOutput, actualOutput);
  return { ...testCase, actualOutput, qualityScore };
}

/**
 * Orchestrates the full test run: setup → load → run → score → write.
 */
async function runTests(): Promise<void> {
  const env = loadEnv();
  const { completionsClient, chromaCollection } = await setupClients(env);

  const inputPath = join(currentDir, 'testCasesDb.csv');
  const outputPath = join(currentDir, 'testResultsDb.csv');

  const testCases = loadTestCases(inputPath);
  console.log(`Found ${testCases.length} test cases`);

  const results: TestResult[] = [];
  for (const [i, testCase] of testCases.entries()) {
    console.log(`[${i + 1}/${testCases.length}] Testing: ${testCase.userInput.substring(0, 50)}...`);
    const result = await runTestCase(testCase, completionsClient, chromaCollection, env.jinaApiKey);
    results.push(result);
    console.log(`  Score: ${result.qualityScore}/10`);
    // Write after every case: the run takes several minutes and may fail mid-way
    // (e.g. rate limit, network error). Writing incrementally preserves all
    // results evaluated so far instead of losing everything on failure.
    writeResults(outputPath, results);
    // Avoid hitting the input token rate limit (10k tokens/min on Sonnet).
    // Skip the delay after the last case so results are written immediately.
    if (i < testCases.length - 1) await new Promise((resolve) => { setTimeout(resolve, 30_000); });
  }

  console.log(`\nAverage score: ${averageScore(results).toFixed(1)}/10`);
  console.log(`Results written to ${outputPath}`);
}

runTests().catch((err: unknown): void => { console.error(err); });
