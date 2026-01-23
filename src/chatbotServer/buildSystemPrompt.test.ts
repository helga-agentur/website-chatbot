import buildSystemPrompt from './buildSystemPrompt';

describe('buildSystemPrompt', (): void => {
  const baseOptions = {
    websiteUrl: 'https://example.com',
    websiteTopic: 'HR-Themen',
    context: 'Some context here',
    currentDate: new Date('2025-01-15T10:00:00Z'),
  };

  it('includes website URL', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('https://example.com');
  });

  it('includes context', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('Some context here');
  });

  it('includes current date in ISO format', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('2025-01-15T10:00:00.000Z');
  });

  it('contains core instructions', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('[ContactRecommendation]');
    expect(prompt).toContain('[Source]');
  });

  it('includes topic guardrails with website topic', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('ONLY answer questions');
    expect(prompt).toContain('HR-Themen');
  });

  it('includes disambiguation guidance', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('multiple meanings');
    expect(prompt).toContain('clarifying question');
  });
});
