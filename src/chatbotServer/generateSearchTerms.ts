import { OpenAI } from 'openai';

/**
 * The question may contain a lot of not-so-relevant information and may be missing synonyms.
 * Therefore we extract relevant search terms from it to query our knowledge base with it
 * afterwards.
 */
export default async ({
  question,
  openAIClient,
}: {
  question: string,
  openAIClient: OpenAI
}): Promise<string[]> => {
  const completion = await openAIClient.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'developer',
        // Source: https://python.langchain.com/v0.1/docs/use_cases/query_analysis/quickstart/
        content: `
          You are an expert at converting user questions terms for search engines.
          Given a question, return a list of search terms optimized to retrieve the most
          relevant results.
          If there are acronyms or words you are not familiar with, do not try to rephrase them.
          The current date is ${new Date().toISOString()}; if this is at the beginning of the year,
          also use the previous year to create search terms.
          Return the terms as a comma separated string.
        `,
        // `
        //   You are a search term generator for a search engine.
        //   All content that can be fetched relates to VSAO Bern; therefore you don't have to
        //   query for that term explicityl.
        //   Given the user's input, return the search terms that we should feed the search engine
        //   with.
        // `
      }, {
        role: 'user',
        content: question,
      },
    ],
  });

  return completion.choices[0].message.content?.split(/\s*,\s*/) ?? [];
};
