type JinaEmbeddingsResponse = {
  data: { embedding: number[] }[];
};

/**
 * Creates and returns Jina embeddings (jina-embeddings-v3) for the given content.
 * Length of returned values corresponds to the length of the input content.
 * task should be 'retrieval.query' when embedding a search query, 'retrieval.passage' when
 * indexing content — this activates task-specific LoRA adapters per Jina's recommendation.
 */
export default async ({
  jinaApiKey,
  content,
  task,
}: {
  jinaApiKey: string;
  content: string[];
  task: 'retrieval.query' | 'retrieval.passage';
}): Promise<number[][]> => {
  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jinaApiKey}`,
    },
    body: JSON.stringify({
      input: content,
      model: 'jina-embeddings-v3',
      task,
    }),
  });

  if (!response.ok) {
    throw new Error(`Jina embeddings request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as JinaEmbeddingsResponse;
  return data.data.map(({ embedding }): number[] => embedding);
};
