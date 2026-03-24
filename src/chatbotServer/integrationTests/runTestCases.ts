/**
 * CSV-based integration test runner for chatbot prompt quality.
 *
 * Reads test cases from testCases.csv, sends each to the chatbot against a static
 * mock context (no DB required), scores each response with Claude, and writes
 * results to testResults.csv with quality scores (0–10).
 *
 * Run with: npm run test:csv
 */
/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import Anthropic from '@anthropic-ai/sdk';
import createCompletion from '../createCompletion.js';
import {
  TestCase, TestResult, collectStream, assessQuality, writeResults, averageScore,
} from './testUtils.js';

// Compiled JS runs from dist/, but test files live in src/
const currentDir = dirname(fileURLToPath(import.meta.url)).replace('/dist/', '/src/');

async function runTestCase(
  testCase: TestCase,
  completionsClient: Anthropic,
  context: string,
): Promise<TestResult> {
  const actualOutput = await collectStream(createCompletion({
    question: testCase.userInput,
    contextAsText: context,
    history: [],
    completionsClient,
  }));
  const qualityScore = await assessQuality(completionsClient, testCase.userInput, testCase.expectedOutput, actualOutput);
  return { ...testCase, actualOutput, qualityScore };
}

async function runTests(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1); }

  const completionsClient = new Anthropic({ apiKey });
  process.env.WEBSITE_BASE_URL = 'https://example.com';
  process.env.WEBSITE_TOPIC = 'Arbeitsrecht und HR-Themen';

  const inputPath = join(currentDir, 'testCases.csv');
  const outputPath = join(currentDir, 'testResults.csv');

  const testCases: TestCase[] = parse(readFileSync(inputPath, 'utf-8'), { columns: true, skip_empty_lines: true });
  const context = readFileSync(join(currentDir, 'testContext.md'), 'utf-8');
  console.log(`Found ${testCases.length} test cases`);

  const results: TestResult[] = [];
  for (const [i, testCase] of testCases.entries()) {
    console.log(`[${i + 1}/${testCases.length}] Testing: ${testCase.userInput.substring(0, 50)}...`);
    const result = await runTestCase(testCase, completionsClient, context);
    results.push(result);
    console.log(`  Score: ${result.qualityScore}/10`);
  }

  console.log(`\nAverage score: ${averageScore(results).toFixed(1)}/10`);
  writeResults(outputPath, results);
  console.log(`Results written to ${outputPath}`);
}

runTests().catch((err: unknown): void => { console.error(err); });
