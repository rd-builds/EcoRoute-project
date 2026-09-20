"""
llm_client.py — Unified LLM provider for GreenMind
----------------------------------------------------
Configurable entirely through environment variables.
No logic, prompts, or response formats live here — this module
only handles transport.

Provider selection
------------------
  LLM_PROVIDER=huggingface   (default) — Hugging Face Inference API
  LLM_PROVIDER=ollama        — local Ollama server

Hugging Face settings
---------------------
  HF_TOKEN   : required — Bearer token from huggingface.co/settings/tokens
  HF_MODEL   : optional — default "Qwen/Qwen2.5-7B-Instruct"
                          (small Qwen2.5 instruct, well-supported on HF
                           Inference Providers; override for a larger/smaller
                           model without changing any other code)

Ollama settings  (for local development)
-----------------------------------------
  OLLAMA_URL   : default "http://localhost:11434/api/generate"
  OLLAMA_MODEL : default "qwen3:0.6b"
"""

import os
import re
import httpx

# ---------------------------------------------------------------------------
# Provider configuration
# ---------------------------------------------------------------------------

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "huggingface")

# Hugging Face
HF_TOKEN    = os.getenv("HF_TOKEN")
HF_MODEL    = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")
HF_BASE_URL = "https://router.huggingface.co/v1"

# Ollama (local dev fallback)
OLLAMA_URL   = os.getenv("OLLAMA_URL",   "https://ecoroute-project-1.onrender.com")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")

# Regex to strip markdown code fences that some chat models wrap around JSON
_FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

async def query_llm(prompt: str) -> str:
    """
    Send a raw prompt string to the configured LLM provider.

    Returns the raw response text — expected to be a JSON string by callers.
    Raises on transport or HTTP errors; each caller is responsible for its
    own fallback / error handling.
    """
    if LLM_PROVIDER == "ollama":
        return await _query_ollama(prompt)
    return await _query_huggingface(prompt)


# ---------------------------------------------------------------------------
# Provider implementations
# ---------------------------------------------------------------------------

async def _query_huggingface(prompt: str) -> str:
    """Call the HF Inference API via its OpenAI-compatible chat/completions endpoint."""
    if not HF_TOKEN:
        raise RuntimeError(
            "HF_TOKEN environment variable is not set. "
            "Set LLM_PROVIDER=ollama to use a local Ollama server instead."
        )

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": HF_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1024,
        "temperature": 0.1,
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{HF_BASE_URL}/chat/completions",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"].strip()
        return _strip_markdown_fences(content)


async def _query_ollama(prompt: str) -> str:
    """Call a local Ollama server using the native generate endpoint."""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",   # Ollama-specific: forces JSON output
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "{}").strip()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_markdown_fences(text: str) -> str:
    """
    Some chat models wrap their JSON response in markdown code fences:
        ```json
        { ... }
        ```
    Strip the fences so callers receive raw JSON text.
    """
    match = _FENCE_RE.search(text)
    if match:
        return match.group(1).strip()
    return text
