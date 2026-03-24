import Anthropic from '@anthropic-ai/sdk';
import type { HistoryEntry } from './types';
import buildSystemPrompt from './buildSystemPrompt.js';

/**
 * Sends question, context and history to Claude and returns the answer as a stream of text chunks.
 */
export default async function* ({
  question,
  contextAsText,
  history,
  completionsClient,
}: {
  question: string;
  contextAsText: string;
  history: HistoryEntry[];
  completionsClient: Anthropic;
}): AsyncGenerator<string> {
  const historyMessages = history
    // Don't pass too much history in; it's not really relevant any more, eats up tokens and costs.
    .slice(-12)
    // History comes in latest-first; we need the latest at the bottom (and start with the current
    // input)
    .map(({ role, message }): Anthropic.MessageParam => ({ role, content: message }));

  const websiteUrl = process.env.WEBSITE_BASE_URL ?? '';
  const websiteTopic = process.env.WEBSITE_TOPIC ?? '';
  if (!websiteUrl) {
    console.warn(
      'Env variable WEBSITE_BASE_URL is not set. Not using it in the prompt.',
    );
  }
  if (!websiteTopic) {
    console.warn(
      'Env variable WEBSITE_TOPIC is not set. Not using it in the prompt.',
    );
  }

  const systemPrompt = buildSystemPrompt({
    websiteUrl,
    websiteTopic,
    context: contextAsText,
    currentDate: new Date(),
  });

  const stream = completionsClient.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    system: systemPrompt,
    messages: [
      ...historyMessages,
      // Funnily, the most recent question comes last
      { role: 'user', content: `This is the main question: ${question}` },
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
