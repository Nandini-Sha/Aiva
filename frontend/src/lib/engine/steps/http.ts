import { StepConfig } from '../../../types';

export async function executeHttpStep(config: StepConfig | undefined) {
  const url = config?.url;
  if (!url) throw new Error("http_request requires 'url' in config");
  
  const method = config?.method || 'GET';
  const headers = config?.headers || {};
  
  const httpRes = await fetch(url, { method, headers });
  const responseText = await httpRes.text();
  
  let parsedData = responseText;
  try {
    parsedData = JSON.parse(responseText);
  } catch (e) {
    // Not JSON
  }
  
  const stepResult = {
    status: httpRes.status,
    response: parsedData
  };
  
  if (!httpRes.ok) {
    throw new Error(`HTTP ${httpRes.status}: ${responseText.substring(0, 100)}`);
  }

  return stepResult;
}
