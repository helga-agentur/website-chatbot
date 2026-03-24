/**
 * Shared types and helpers for CSV-based integration test runners.
 */
import { writeFileSync } from 'fs';
import { stringify } from 'csv-stringify/sync';
import Anthropic from '@anthropic-ai/sdk';

/**
 * One row from the input CSV: the question to ask and the expected behavior to score against.
 */
export interface TestCase {
  userInput: string;
  expectedOutput: string;
}

/**
 * One row of the output CSV: the test case plus what the chatbot actually said and its score.
 */
export interface TestResult extends TestCase {
  actualOutput: string;
  qualityScore: number;
}

/**
 * Drains an async string stream into a single concatenated string.
 */
export async function collectStream(stream: AsyncIterable<string>): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks.join('');
}

/**
 * Asks Claude Haiku to score how well actualOutput matches expectedOutput (0–10).
 * Haiku is sufficient here: scoring is a simple comparison task, not reasoning.
 */
export async function assessQuality(
  completionsClient: Anthropic,
  userInput: string,
  expectedOutput: string,
  actualOutput: string,
): Promise<number> {
  const response = await completionsClient.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    system: `You are a test evaluator. Given a user input, expected behavior, and actual output,
rate how well the actual output meets the expected behavior on a scale of 0-10.

- 10: Perfect match, exceeds expectations
- 7-9: Good match, meets most expectations
- 4-6: Partial match, some expectations met
- 1-3: Poor match, few expectations met
- 0: Complete failure, opposite of expected

Respond with JSON: {"score": <number>, "reason": "<brief explanation>"}`,
    messages: [
      {
        role: 'user',
        content: `User Input: ${userInput}

Expected Behavior: ${expectedOutput}

Actual Output: ${actualOutput}

Rate the quality (0-10):`,
      },
    ],
  });

  const raw = response.content.find((b) => b.type === 'text')?.text ?? '{"score": 0}';
  // Models sometimes wrap JSON in markdown fences; strip them before parsing.
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const { score } = JSON.parse(text) as { score: number };
  return score;
}

/**
 * Serialises results to a CSV file with a header row.
 */
export function writeResults(outputPath: string, results: TestResult[]): void {
  const csv = stringify(results, {
    header: true,
    columns: ['userInput', 'expectedOutput', 'actualOutput', 'qualityScore'],
  });
  writeFileSync(outputPath, csv);
}

export function averageScore(results: TestResult[]): number {
  return results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
}
