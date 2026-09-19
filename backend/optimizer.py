import json
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen3:0.6b"


class OptimizeRequest(BaseModel):
    prompt: str


class OptimizeResponse(BaseModel):
    optimizedPrompt: str
    changes: list[str]


_LEAKED_INSTRUCTION_MARKERS = [
    "bullet list", "bullet lists", "tables", "json", "formatting", "headings",
    "tone descriptors", "output structures", "extra constraints", "remove filler",
    "return it unchanged", "optimizedprompt", "system prompt", "internal rules",
    "do not add", "keep audience", "guidance for rewriting"
]


def sanitize_optimized_prompt(original_prompt: str, optimized_prompt: str) -> tuple[str, bool]:
    """
    Sanitizes optimized prompt output to detect and neutralize system instruction leakage.
    Returns (clean_prompt, was_leaked).
    """
    if not optimized_prompt or not isinstance(optimized_prompt, str):
        return original_prompt, True

    lower_opt = optimized_prompt.lower()
    lower_orig = original_prompt.lower()

    # Detect leaked system instruction markers that were not present in the original prompt
    for marker in _LEAKED_INSTRUCTION_MARKERS:
        if marker in lower_opt and marker not in lower_orig:
            return original_prompt, True

    # Detect suspicious length expansion (optimizer should not significantly bloat prompt length)
    if len(optimized_prompt) > max(len(original_prompt) * 1.5, len(original_prompt) + 30):
        return original_prompt, True

    return optimized_prompt.strip(), False


async def query_ollama_optimizer(prompt: str) -> dict:
    prompt_template = (
        "You are GreenMind's Prompt Optimizer. Clean the user prompt by removing unnecessary "
        "filler words (e.g. 'could you please', 'I was wondering if', 'hello').\n\n"
        "RULES:\n"
        "1. Output ONLY the cleaned user prompt in the 'optimizedPrompt' field.\n"
        "2. Do NOT add meta-commentary, new rules, formatting instructions, or system text.\n"
        "3. Preserve all original constraints, numbers, word limits, and requirements.\n"
        "4. If the prompt is already clear and concise, return it unchanged.\n\n"
        "You MUST respond ONLY with a single valid raw JSON object matching:\n"
        "{\n"
        '  "optimizedPrompt": "the cleaned prompt text",\n'
        '  "changes": ["short description of each removal made"]\n'
        "}\n\n"
        f"User Prompt: {prompt}"
    )

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt_template,
        "stream": False,
        "format": "json"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            raw_text = data.get("response", "{}").strip()
            return json.loads(raw_text)
        except (httpx.HTTPError, json.JSONDecodeError):
            return {
                "optimizedPrompt": prompt,
                "changes": []
            }


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_prompt_endpoint(request: OptimizeRequest):
    original = request.prompt
    result = await query_ollama_optimizer(original)

    raw_optimized = result.get("optimizedPrompt", original)
    cleaned_prompt, was_leaked = sanitize_optimized_prompt(original, raw_optimized)

    changes = result.get("changes", [])
    if not isinstance(changes, list):
        changes = [str(changes)]

    if was_leaked:
        changes = []

    return OptimizeResponse(
        optimizedPrompt=cleaned_prompt,
        changes=changes
    )
