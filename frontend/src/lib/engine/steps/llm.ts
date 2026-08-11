import { StepConfig } from '../../../types';

export async function executeLlmStep(config: StepConfig | undefined, previousOutput: any) {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || config?.base_url || 'https://api.groq.com/openai/v1/chat/completions';
  const model = config?.model || process.env.LLM_MODEL || 'llama-3.1-8b-instant';

  if (!apiKey) {
    throw new Error("LLM_API_KEY environment variable is missing.");
  }
  
  const prompt = config?.prompt;
  if (!prompt) {
      throw new Error("llm_call requires a 'prompt' in config");
  }

  const llmResponse: any = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: config?.system_prompt || 'You are an AI agent in a workflow step. Process the input provided.' },
        { role: 'user', content: JSON.stringify({ input: previousOutput, prompt }) }
      ]
    })
  });

  if (!llmResponse.ok) {
    const errBody = await llmResponse.text();
    throw new Error(`LLM API Error: ${llmResponse.status} - ${errBody}`);
  }

  const llmData: any = await llmResponse.json();
  return { text: llmData.choices?.[0]?.message?.content || "No content returned" };
}
