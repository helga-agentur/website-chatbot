import { OpenAI } from 'openai';

/**
 * Creates and returns OpenAI embeddings (text-embedding-3-large) for the given content.
 * Length of returned values corresponds to the length of the input content.
 */
export default async ({
  openAIClient,
  content,
}: {
  openAIClient: OpenAI,
  content: string[]
}): Promise<number[][]> => {
  const response = await openAIClient.embeddings.create({
    model: 'text-embedding-3-large',
    input: content,
  });
  // If input is an array, data will be an array of the same length.
  return response.data.map(({ embedding }): number[] => embedding);
};
