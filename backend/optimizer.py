import os
import re
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Tuple, List
from llm_client import query_llm

router = APIRouter()


class OptimizeRequest(BaseModel):
    prompt: str
    task: Optional[str] = None
    qualityScore: Optional[float] = None


class OptimizeResponse(BaseModel):
    optimizedPrompt: str
    changes: List[str]


_LEAKED_INSTRUCTION_MARKERS = [
    "system prompt", "internal rules", "guidance for rewriting",
    "optimizedprompt", "return it unchanged", "you are greenmind"
]


def sanitize_optimized_prompt(original_prompt: str, optimized_prompt: str) -> Tuple[str, bool]:
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

    # Detect suspicious length expansion
    if len(optimized_prompt) > max(len(original_prompt) * 3.5, len(original_prompt) + 250):
        return original_prompt, True

    return optimized_prompt.strip(), False


def optimize_prompt_intelligently(prompt: str, quality_score: float = 50.0, task_type: str = 'other') -> Tuple[str, List[str]]:
    """
    Intelligently optimizes prompts:
    - Vague/telegram prompts (e.g. 'write email dean') are expanded into well-structured,
      actionable prompts with explicit placeholders for missing facts.
    - Already specific and well-formed prompts are preserved with minimal polish.
    - Verbose fluff and conversational filler are cleanly trimmed.
    """
    raw = prompt.strip()
    lower = raw.lower()
    changes = []
    
    # 1. If the prompt is already high quality (score >= 85), preserve intent and do light polish
    if quality_score >= 85:
        cleaned = re.sub(r'^(?:could|can|would)\s+you\s+(?:please\s+)?(?:kindly\s+)?(?:help\s+me\s+)?(?:to\s+)?', '', raw, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r'^(?:please|kindly)\s+', '', cleaned, flags=re.IGNORECASE).strip()
        if cleaned and cleaned != raw:
            changes.append('Removed conversational request prefix')
            raw = cleaned[0].upper() + cleaned[1:] if cleaned else raw
        return raw, changes

    # 2. Clean conversational filler / politeness preamble
    cleaned = re.sub(r'^(?:could|can|would)\s+you\s+(?:please\s+)?(?:kindly\s+)?(?:help\s+me\s+)?(?:to\s+)?', '', raw, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r'^(?:please|kindly)\s+', '', cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r'^(?:i\s+(?:was\s+wondering\s+if\s+you\s+could|would\s+like\s+you\s+to|want\s+you\s+to|need\s+you\s+to|am\s+asking\s+you\s+to))\s+', '', cleaned, flags=re.IGNORECASE).strip()
    if cleaned != raw and cleaned:
        changes.append('Removed conversational filler')
        raw = cleaned

    words = [w for w in re.findall(r'\b\w+\b', raw)]
    
    # 3. If the prompt is vague / incomplete (quality_score < 75 and word count <= 8):
    if quality_score < 75 and len(words) <= 8:
        # A. Email / Communication archetype
        if 'email' in lower or 'letter' in lower or 'dean' in lower or 'boss' in lower or 'professor' in lower or task_type == 'writing':
            recipient = 'the dean' if 'dean' in lower else ('my professor' if 'professor' in lower else ('my manager' if 'boss' in lower else '[recipient]'))
            topic_hint = 'an examination issue' if 'exam' in lower else ('a project update' if 'project' in lower else '[specific topic/issue, e.g. an exam network issue]')
            optimized = f'Write a professional and concise email to {recipient} regarding {topic_hint}. Clearly explain the context, describe the issue and its impact, and politely request [desired action, e.g. reconsideration or next steps]. Maintain a respectful and formal tone.'
            changes.append('Expanded vague request with professional email structure, context requirements, and action placeholders')
            return optimized, changes

        # B. Explanation / Educational archetype
        if task_type == 'education' or any(k in lower for k in ['explain', 'teach', 'what is', 'how does', 'java', 'python', 'recursion']):
            topic = raw
            topic = re.sub(r'^(?:explain|teach|what\s+is|tell\s+me\s+about)\s+', '', topic, flags=re.IGNORECASE).strip()
            topic = topic if topic else '[topic]'
            optimized = f'Explain {topic} clearly for [target audience, e.g. a beginner]. Break down the fundamental concepts step-by-step, provide a concise real-world or code example, and highlight key takeaways.'
            changes.append('Added target audience scaffolding, step-by-step structure, and example requirements')
            return optimized, changes

        # C. Coding / Implementation archetype
        if task_type == 'coding' or any(k in lower for k in ['code', 'program', 'debug', 'function', 'algorithm', 'script', 'fix']):
            if 'debug' in lower or 'fix' in lower or 'error' in lower:
                optimized = f'Debug the following issue in [{raw}]: [paste relevant code and error trace]. Explain the root cause of the error, provide the corrected code snippet, and outline best practices to avoid it.'
                changes.append('Structured debugging request with error trace placeholder and root-cause analysis')
                return optimized, changes
            else:
                optimized = f'Implement a clean, robust solution for [{raw}] in [language]. Include modular code with comments, handle edge cases, and provide a brief explanation of time and space complexity.'
                changes.append('Added implementation requirements, edge case handling, and complexity analysis')
                return optimized, changes

        # D. General fallback
        optimized = f'{raw.capitalize()}. Provide a structured, comprehensive response covering key points, relevant examples, and clear next steps.'
        changes.append('Added structural clarity and output guidance')
        return optimized, changes

    # 4. For medium prompts, ensure proper capitalization and clean formatting
    optimized = raw[0].upper() + raw[1:] if raw else raw
    if not optimized.endswith(('.', '?', '!')):
        optimized += '.'
    return optimized, changes


async def query_ollama_optimizer(prompt: str, quality_score: float = 50.0, task_type: str = 'other') -> dict:
    prompt_template = (
        "You are GreenMind's Prompt Optimizer. Refine the user prompt for maximum clarity, actionable structure, and specificity.\n\n"
        "RULES:\n"
        "1. If the user prompt is vague (e.g. 'write email dean'), expand it into a well-structured prompt with clear context and explicit placeholders (e.g. '[recipient]', '[details]') without fabricating unstated facts.\n"
        "2. If the user prompt is already high quality and specific, preserve it with minimal polish.\n"
        "3. Remove unnecessary politeness filler (e.g. 'could you please', 'I was wondering if').\n"
        "4. Output ONLY the optimized prompt in 'optimizedPrompt'.\n\n"
        "You MUST respond ONLY with a single valid raw JSON object matching:\n"
        "{\n"
        '  "optimizedPrompt": "the refined prompt text",\n'
        '  "changes": ["short description of improvements made"]\n'
        "}\n\n"
        f"User Prompt: {prompt}"
    )

    try:
        raw_text = await query_llm(prompt_template)
        data = json.loads(raw_text)
        if data.get("optimizedPrompt"):
            return data
    except Exception:
        pass

    # Deterministic fallback optimizer
    opt_text, changes = optimize_prompt_intelligently(prompt, quality_score, task_type)
    return {
        "optimizedPrompt": opt_text,
        "changes": changes
    }


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_prompt_endpoint(request: OptimizeRequest):
    original = request.prompt
    task = request.task or 'other'
    quality = request.qualityScore or 50.0
    
    result = await query_ollama_optimizer(original, quality, task)

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
