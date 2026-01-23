/**
 * CSV-based integration test runner for chatbot prompt quality.
 *
 * Reads test cases from testCases.csv, sends each to the chatbot, then uses
 * GPT to assess whether the actual output matches expected behavior.
 * Results are written to testResults.csv with quality scores (0-10).
 *
 * Run with: npm run test:csv
 */
/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import OpenAI from 'openai';
import createCompletion from '../createCompletion.js';

// Compiled JS runs from dist/, but test files live in src/
const currentDir = dirname(fileURLToPath(import.meta.url)).replace(
  '/dist/',
  '/src/',
);

/** Input format: what the user asks and what behavior we expect. */
interface TestCase {
  userInput: string;
  expectedOutput: string;
}

/** Output format: includes the actual chatbot response and GPT's quality score. */
interface TestResult extends TestCase {
  actualOutput: string;
  qualityScore: number;
}

/** Collects all chunks from an OpenAI streaming response into a single string. */
async function collectStream(
  stream: AsyncIterable<OpenAI.ChatCompletionChunk>,
): Promise<string> {
  const chunks: string[] = [];
  const iterator = stream[Symbol.asyncIterator]();
  let next = await iterator.next();
  while (!next.done) {
    chunks.push(next.value.choices[0]?.delta?.content ?? '');
    next = await iterator.next();
  }
  return chunks.join('');
}

/** Uses GPT to score how well actualOutput matches expectedOutput (0-10). */
async function assessQuality(
  openAIClient: OpenAI,
  userInput: string,
  expectedOutput: string,
  actualOutput: string,
): Promise<number> {
  const response = await openAIClient.chat.completions.create({
    model: 'gpt-5-nano',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a test evaluator. Given a user input, expected behavior, and actual output,
rate how well the actual output meets the expected behavior on a scale of 0-10.

- 10: Perfect match, exceeds expectations
- 7-9: Good match, meets most expectations
- 4-6: Partial match, some expectations met
- 1-3: Poor match, few expectations met
- 0: Complete failure, opposite of expected

Respond with JSON: {"score": <number>, "reason": "<brief explanation>"}`,
      },
      {
        role: 'user',
        content: `User Input: ${userInput}

Expected Behavior: ${expectedOutput}

Actual Output: ${actualOutput}

Rate the quality (0-10):`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? '{"score": 0}';
  const parsed = JSON.parse(content) as { score: number };
  return parsed.score;
}

/**
 * Main test runner. Loads test cases from CSV, runs each through the chatbot,
 * scores the results, and writes output CSV.
 */
async function runTests(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set');
    process.exit(1);
  }

  const openAIClient = new OpenAI({ apiKey });
  process.env.WEBSITE_BASE_URL = 'https://example.com';
  process.env.WEBSITE_TOPIC = 'Arbeitsrecht und HR-Themen';

  const inputPath = join(currentDir, 'testCases.csv');
  const contextPath = join(currentDir, 'testContext.md');
  const outputPath = join(currentDir, 'testResults.csv');

  // Load test cases from CSV
  console.log('Reading test cases...');
  const testCases: TestCase[] = parse(readFileSync(inputPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
  });
  console.log(`Found ${testCases.length.toString()} test cases`);

  // Load mock context (simulates vector DB results)
  const context = readFileSync(contextPath, 'utf-8');

  const results: TestResult[] = [];

  // Run each test case sequentially
  const total = testCases.length;
  let current = 0;
  for (const testCase of testCases) {
    current += 1;
    console.log(
      `[${current.toString()}/${total.toString()}] Testing: ${testCase.userInput.substring(0, 50)}...`,
    );

    // Get chatbot response
    const stream = await createCompletion({
      question: testCase.userInput,
      contextAsText: context,
      history: [],
      openAIClient,
    });
    const actualOutput = await collectStream(stream);

    // Score the response
    const qualityScore = await assessQuality(
      openAIClient,
      testCase.userInput,
      testCase.expectedOutput,
      actualOutput,
    );

    results.push({
      userInput: testCase.userInput,
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      qualityScore,
    });

    console.log(`  Score: ${qualityScore.toString()}/10`);
  }

  // Summary and output
  const avgScore = results.reduce((sum, r): number => sum + r.qualityScore, 0)
    / results.length;
  console.log(`\nAverage score: ${avgScore.toFixed(1)}/10`);

  const csvOutput = stringify(results, {
    header: true,
    columns: ['userInput', 'expectedOutput', 'actualOutput', 'qualityScore'],
  });
  writeFileSync(outputPath, csvOutput);
  console.log(`Results written to ${outputPath}`);
}

runTests().catch((err: unknown): void => {
  console.error(err);
});
