import OpenAI from 'openai';
import type { HistoryEntry } from './types';

/**
 * Sends question, context and history to OpenAI and returns the answer as a stream.
 */
export default async ({
  question,
  contextAsText,
  history,
  openAIClient,
}: {
  question: string,
  contextAsText: string,
  history: HistoryEntry[],
  openAIClient: OpenAI,
}): Promise<AsyncIterable<OpenAI.ChatCompletionChunk>> => {
  const historyForOpenAI = history
    // Don't pass too much history in; it's not really relevant any more, eats up tokens and costs.
    .slice(-12)
    // History comes in latest-first; we need the latest at the bottom (and start with the current
    // input)
    .map(({ role, message }): OpenAI.ChatCompletionMessageParam => ({
      role,
      content: message,
    }));

  console.log('history', historyForOpenAI);
  console.log('Trying to answer question: %s', question);
  const websiteURL = process.env.WEBSITE_BASE_URL;
  if (!websiteURL) {
    console.warn('Env variable WEBSITE_BASE_URL is not set. Not using it in the prompt.');
  }
  const stream = await openAIClient.chat.completions.create({
    model: 'gpt-4.1-nano',
    stream: true,
    response_format: { type: 'text' },
    messages: [
      {
        role: 'developer',
        content: `
          You are a chatbot on the website ${(websiteURL ?? '')} and answer website-related
          questions. Answer any question based **solely** on the context provided below.

          Use the language of the user's input. 
          When the input language is German, use Swiss grammar and replace all ß with ss;
          **NEVER** return ß.

          In German, use "du", not "Sie" (Höflichkeitsform).

          Keep your answer short, concise and courteous. Only answer if you're sure of the
          answer's correctness.

          If the content is markdown, consider titles more relevant than regular paragraphs.

          If a date is provided, take it into consideration. Prefer more recent content and
          content with an unknown date over older content.
          The current date is ${new Date().toISOString()}.

          If you can't answer the question, say so in a short, empatic sentence. Always add
          [ContactRecommendation] after it.

          Prioritize the user's most recent message when generating a response; only use
          previous messages if they are relevant to the current question.

          Try to guess which ones of the context sources are the most relevant to answer the
          question. **Always** provide one or more source URLs in the form
          of [Source](url/comes/here).

          Always return plain text, never HTML or Markdown.
          
          Context:
          ---
          ${contextAsText}
          ---
        `,
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
