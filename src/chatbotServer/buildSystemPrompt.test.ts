import buildSystemPrompt from './buildSystemPrompt';

describe('buildSystemPrompt', (): void => {
  const baseOptions = {
    websiteUrl: 'https://example.com',
    websiteTopic: 'HR-Themen',
    context: 'Some context here',
    currentDate: new Date('2025-01-15T10:00:00Z'),
  };

  it('interpolates the website URL', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('https://example.com');
  });

  it('interpolates the website topic', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('HR-Themen');
  });

  it('interpolates the context', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('Some context here');
  });

  it('formats the current date as ISO string', (): void => {
    const prompt = buildSystemPrompt(baseOptions);
    expect(prompt).toContain('2025-01-15T10:00:00.000Z');
  });
});
