import OpenAI from 'openai';
import type { HistoryEntry } from './types';
import buildSystemPrompt from './buildSystemPrompt.js';

/**
 * Sends question, context and history to OpenAI and returns the answer as a stream.
 */
export default async ({
  question,
  contextAsText,
  history,
  openAIClient,
}: {
  question: string;
  contextAsText: string;
  history: HistoryEntry[];
  openAIClient: OpenAI;
}): Promise<AsyncIterable<OpenAI.ChatCompletionChunk>> => {
  const historyForOpenAI = history
    // Don't pass too much history in; it's not really relevant any more, eats up tokens and costs.
    .slice(-12)
    // History comes in latest-first; we need the latest at the bottom (and start with the current
    // input)
    .map(
      ({ role, message }): OpenAI.ChatCompletionMessageParam => ({
        role,
        content: message,
      }),
    );

  const websiteUrl = process.env.WEBSITE_BASE_URL ?? '';
  if (!websiteUrl) {
    console.warn(
      'Env variable WEBSITE_BASE_URL is not set. Not using it in the prompt.',
    );
  }

  const systemPrompt = buildSystemPrompt({
    websiteUrl,
    context: contextAsText,
    currentDate: new Date(),
  });

  const stream = await openAIClient.chat.completions.create({
    model: 'gpt-5-nano',
    stream: true,
    response_format: { type: 'text' },
    messages: [
      {
        role: 'developer',
        content: systemPrompt,
      },
      ...historyForOpenAI,
      // Funnily, the most recent question comes last
      {
        role: 'user',
        content: `This is the main question: ${question}`,
      },
    ],
  });
  return stream;
};
