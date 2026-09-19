const API_BASE_URL = 'http://127.0.0.1:8000';

export async function analyzePrompt(params) {
  let prompt, task, currentAI, history;

  if (typeof params === 'string') {
    prompt = params;
    history = [];
  } else if (params && typeof params === 'object') {
    prompt = params.prompt;
    task = params.task;
    currentAI = params.currentAI;
    history = params.history || [];
  } else {
    throw new Error('Invalid arguments provided to analyzePrompt.');
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      task,
      currentAI,
      history,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Backend error (${response.status} ${response.statusText}): ${errorText || 'Failed to analyze prompt'}`
    );
  }

  return await response.json();
}
