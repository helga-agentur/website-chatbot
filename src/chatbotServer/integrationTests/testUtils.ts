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
 * Extracts a 0–10 score from the judge model's raw text using three strategies in order:
 * 1. Full JSON parse of {"score": N}
 * 2. Regex extraction of a "score": N field from partial/malformed JSON
 * 3. First standalone integer 0–10 found anywhere in the text
 * Returns null if all strategies fail.
 *
 * Why: eval runs take minutes and talk to a non-deterministic judge model. A single
 * fenced, partial, or off-format response from the LLM must not abort the entire run —
 * that would produce a false negative unrelated to chatbot quality.
 */
function extractScore(raw: string): number | null {
  // LLM sometimes wraps its JSON response in markdown fences (```json … ```) — strip them.
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const { score } = JSON.parse(text) as { score: number };
    if (typeof score === 'number' && score >= 0 && score <= 10) return score;
  } catch { /* fall through */ }

  const fieldMatch = /"score"\s*:\s*(\d+(?:\.\d+)?)/.exec(text);
  if (fieldMatch) {
    const score = parseFloat(fieldMatch[1]);
    if (score >= 0 && score <= 10) return score;
  }

  const numberMatch = /\b(10|[0-9])\b/.exec(text);
  if (numberMatch) return parseInt(numberMatch[1], 10);

  return null;
}

/**
 * Asks Claude Haiku to score how well actualOutput matches expectedOutput (0–10).
 * Haiku is sufficient here: scoring is a simple comparison task, not reasoning.
 *
 * Retries the same request up to 3 times on unparseable responses — the judge model
 * is non-deterministic and will usually produce valid JSON on a subsequent attempt.
 * Returns -1 if all attempts fail so the run continues and failures are visible in the CSV.
 */
export async function assessQuality(
  completionsClient: Anthropic,
  userInput: string,
  expectedOutput: string,
  actualOutput: string,
): Promise<number> {
  const request = {
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
        role: 'user' as const,
        content: `User Input: ${userInput}\n\nExpected Behavior: ${expectedOutput}\n\nActual Output: ${actualOutput}\n\nRate the quality (0-10):`,
      },
    ],
  };

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await completionsClient.messages.create(request);
    const raw = response.content.find((block) => block.type === 'text')?.text ?? '';
    const score = extractScore(raw);
    if (score !== null) return score;
    console.warn(`assessQuality: unparseable response (attempt ${attempt}/3) for "${userInput.substring(0, 60)}…"`);
  }

  console.warn('assessQuality: all attempts failed, recording score as -1');
  return -1;
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
