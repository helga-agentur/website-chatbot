import Anthropic from '@anthropic-ai/sdk';

/**
 * The question may contain a lot of not-so-relevant information and may be missing synonyms.
 * Therefore we extract relevant search terms from it to query our knowledge base with it
 * afterwards.
 */
export default async ({
  question,
  completionsClient,
}: {
  question: string,
  completionsClient: Anthropic
}): Promise<string[]> => {
  const response = await completionsClient.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    system: `
      You are an expert at converting user questions terms for search engines.
      Given a question, return a list of search terms optimized to retrieve the most
      relevant results.
      If there are acronyms or words you are not familiar with, do not try to rephrase them.
      The current date is ${new Date().toISOString()}; if this is at the beginning of the year,
      also use the previous year to create search terms.
      Return the terms as a comma separated string.
    `,
    messages: [{ role: 'user', content: question }],
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '';
  return text.split(/\s*,\s*/).filter(Boolean);
};
