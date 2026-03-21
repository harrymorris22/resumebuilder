import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;
let currentApiKey = '';

export function getClient(apiKey: string): Anthropic {
  if (client && currentApiKey === apiKey) return client;

  client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
  currentApiKey = apiKey;
  return client;
}
