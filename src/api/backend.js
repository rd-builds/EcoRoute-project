const API_BASE_URL = 'https://ecoroute-project-1.onrender.com/';
/**
 * Send a prompt and optional parameters to the EcoRoute backend for analysis.
 *
 * @param {string | { prompt: string, task?: string, currentAI?: string, history?: string[] }} params
 * @returns {Promise<object>} Analysis results from the backend
 */
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

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
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
  } catch (networkError) {
    console.error('EcoRoute API Network Error:', networkError);
    throw new Error('Unable to connect to the analysis server. Make sure the backend is running.');
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.detail || '';
    } catch {
      errorDetail = await response.text().catch(() => '');
    }

    const formattedError = errorDetail
      ? `Backend error (${response.status}): ${errorDetail}`
      : `Backend error (${response.status} ${response.statusText || 'Unknown'})`;

    console.error('EcoRoute API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      detail: errorDetail,
    });

    throw new Error(formattedError);
  }

  try {
    return await response.json();
  } catch (parseError) {
    console.error('EcoRoute API JSON Parse Error:', parseError);
    throw new Error('Invalid response received from the analysis server.');
  }
}
