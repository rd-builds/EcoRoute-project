import os
import re
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Tuple, List, Dict, Any
from llm_client import query_llm
from token_counter import calculate_token_savings

router = APIRouter()


class OptimizeRequest(BaseModel):
    prompt: str
    task: Optional[str] = None
    qualityScore: Optional[float] = None


class OptimizeResponse(BaseModel):
    originalPrompt: Optional[str] = None
    optimizedPrompt: str
    reasoning: Optional[str] = None
    changes: List[str] = []
    neededOptimization: Optional[bool] = True
    tokensBefore: Optional[int] = None
    tokensAfter: Optional[int] = None
    tokenReduction: Optional[int] = None
    tokenReductionPercentage: Optional[float] = None


_LEAKED_INSTRUCTION_MARKERS = [
    "system prompt", "internal rules", "guidance for rewriting",
    "optimizedprompt", "return it unchanged", "you are greenmind",
    "you are ecoroute"
]

FILLER_PATTERNS = [
    r'^(?:could|can|would|will)\s+you\s+(?:please\s+)?(?:kindly\s+)?(?:help\s+me\s+)?(?:to\s+)?',
    r'^(?:please|kindly)\s+',
    r'^(?:i\s+(?:was\s+wondering\s+if\s+you\s+could|would\s+like\s+you\s+to|want\s+you\s+to|need\s+you\s+to|am\s+asking\s+you\s+to|was\s+hoping\s+you\s+could|am\s+hoping\s+you\s+could))\s+',
    r'^(?:just\s+wanted\s+to\s+ask|i\s+would\s+like\s+to\s+ask)\s+',
    r'^(?:hello|hi|hey)\s*,?\s*',
]

TAIL_FILLER_PATTERNS = [
    r'\s+(?:thank\s+you|thanks(?:\s+a\s+lot|\s+in\s+advance|\s+so\s+much)?|and\s+for\s+your\s+help)[.!\s]*$',
    r'\s+(?:please\s+let\s+me\s+know)[.!\s]*$',
]

WORDY_REPLACEMENTS = [
    (r'\bin order to\b', 'to'),
    (r'\bdue to the fact that\b', 'because'),
    (r'\bat this point in time\b', 'now'),
    (r'\bat all times\b', 'always'),
    (r'\bin the event that\b', 'if'),
    (r'\bfor the purpose of\b', 'for'),
    (r'\ba lot of\b', 'many'),
    (r'\bmake sure that\b', 'ensure'),
    (r'\bit is important to note that\b', ''),
    (r'\bas a matter of fact\b', ''),
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

    # Detect suspicious length expansion (unreasonably massive)
    if len(optimized_prompt) > max(len(original_prompt) * 5.0, len(original_prompt) + 600):
        return original_prompt, True

    return optimized_prompt.strip(), False


def clean_conversational_filler(text: str) -> Tuple[str, bool]:
    """Removes conversational filler, polite preambles, and low-value wordy phrases."""
    cleaned = text.strip()
    changed = False

    for pattern in FILLER_PATTERNS:
        new_cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()
        if new_cleaned != cleaned:
            cleaned = new_cleaned
            changed = True

    for pattern in TAIL_FILLER_PATTERNS:
        new_cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()
        if new_cleaned != cleaned:
            cleaned = new_cleaned
            changed = True

    for pattern, repl in WORDY_REPLACEMENTS:
        new_cleaned = re.sub(pattern, repl, cleaned, flags=re.IGNORECASE).strip()
        if new_cleaned != cleaned:
            cleaned = new_cleaned
            changed = True

    # Clean up punctuation spacing
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = re.sub(r'\s*,\s*', ', ', cleaned)
    cleaned = re.sub(r'^[,\s;:]+', '', cleaned).strip()

    if cleaned and not cleaned[0].isupper() and cleaned[0].isalpha():
        cleaned = cleaned[0].upper() + cleaned[1:]

    return cleaned, changed


def is_already_well_structured(prompt: str) -> bool:
    """
    Determines if a prompt is already well-structured and concise,
    meaning no major optimization or rewriting should be forced.
    """
    raw = prompt.strip()
    lines = [l.strip() for l in raw.splitlines() if l.strip()]

    # Check for markdown structure or bullet points
    has_headers = any(l.startswith('#') or (l.endswith(':') and len(l.split()) <= 4) for l in lines)
    has_bullets = any(re.match(r'^(?:[-*•]|\d+\.)\s+', l) for l in lines)

    words = re.findall(r'\b\w+\b', raw)
    if len(words) < 15:
        return False

    _, had_filler = clean_conversational_filler(raw)

    sentences = [s.strip().lower() for s in re.split(r'[.!?\n]+', raw) if len(s.strip().split()) >= 4]
    has_duplicates = len(sentences) != len(set(sentences))

    if (has_headers or has_bullets) and not had_filler and not has_duplicates:
        return True

    return False


def consolidate_repetitive_prompt(text: str) -> Tuple[str, List[str]]:
    """
    Consolidates repetitive, wordy prompts into a clean, structured set of requirements.
    Preserves all unique context, variables, code, domain facts, and constraints.
    """
    cleaned, _ = clean_conversational_filler(text)
    changes = []

    raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?\n])\s+', cleaned) if s.strip()]
    if not raw_sentences:
        return cleaned, changes

    processed_sentences = []
    seen_normalized = set()
    seen_topics = set()

    for sent in raw_sentences:
        sent_clean, _ = clean_conversational_filler(sent)
        norm = re.sub(r'[^a-zA-Z0-9]', '', sent_clean.lower())
        if not norm:
            continue
        if norm in seen_normalized:
            changes.append(f"Removed exact duplicate instruction: '{sent[:40]}...'")
            continue
        seen_normalized.add(norm)

        sent_lower = sent_clean.lower()

        # Check repeated programming language declarations
        if re.search(r'\b(?:use|in|write it in|ensure you use)\s+(?:python|javascript|typescript|java|c\+\+|rust|go|sql)\b', sent_lower):
            if 'lang_spec' in seen_topics:
                changes.append("Consolidated redundant programming language requirement")
                continue
            seen_topics.add('lang_spec')

        # Check repeated error handling declarations
        if re.search(r'\b(?:handle errors|error handling|error-handling|exception handling)\b', sent_lower):
            if 'error_handling' in seen_topics:
                changes.append("Consolidated repeated error handling instruction")
                continue
            seen_topics.add('error_handling')

        # Check repeated documentation/commenting declarations
        if re.search(r'\b(?:include comments|well documented|clean comments|docstrings)\b', sent_lower):
            if 'comments' in seen_topics:
                changes.append("Consolidated repeated commenting / documentation requirement")
                continue
            seen_topics.add('comments')

        # Check repeated tone declarations
        if re.search(r'\b(?:tone is professional|make sure.*professional|clean and professional|formal tone)\b', sent_lower):
            if 'tone_professional' in seen_topics:
                changes.append("Consolidated duplicate professional tone instruction")
                continue
            seen_topics.add('tone_professional')

        processed_sentences.append(sent_clean)

    # Format result if heavily repetitive
    if len(processed_sentences) > 3 and len(changes) >= 2:
        task_sentence = processed_sentences[0]
        other_requirements = processed_sentences[1:]
        bullet_items = "\n".join([f"- {s.rstrip('.')}." for s in other_requirements])
        result = f"{task_sentence}\n\nRequirements:\n{bullet_items}"
        changes.append("Structured repetitive instructions into clean bulleted requirements")
    else:
        result = " ".join(processed_sentences)

    return result, changes


def optimize_prompt_intelligently(prompt: str, quality_score: float = 50.0, task_type: str = 'other') -> Dict[str, Any]:
    """
    Intelligently optimizes prompts deterministically when LLM is offline or prompt needs rule-based refinement:
    - For SHORT prompts: Adds missing structure/specificity (e.g. bullet points, concise scope) without arbitrary requirements.
    - For LARGE/REPETITIVE prompts: Deduplicates instructions, consolidates redundant requirements, removes conversational filler, and organizes structure while preserving all context.
    - For WELL-STRUCTURED prompts: Preserves the prompt intact without forcing artificial changes.
    """
    raw = prompt.strip()
    if not raw:
        return {
            "optimizedPrompt": raw,
            "reasoning": "Prompt is empty.",
            "changes": [],
            "neededOptimization": False
        }

    words = re.findall(r'\b\w+\b', raw)
    word_count = len(words)

    # 1. Well-structured / already optimal prompt
    if is_already_well_structured(raw):
        return {
            "optimizedPrompt": raw,
            "reasoning": "Prompt is already well-structured. Preserved original with no major changes needed.",
            "changes": ["Prompt structure, constraints, and scope are already optimal."],
            "neededOptimization": False
        }

    # 2. Short / Vague prompt handling
    if word_count <= 8 and not any(c in raw for c in ['\n', '-', '*', ':']):
        clean_topic, _ = clean_conversational_filler(raw)
        clean_topic = clean_topic.rstrip('.!? ')
        clean_topic = re.sub(r'^(?:about|on|regarding|for|the|a|an)\s+', '', clean_topic, flags=re.IGNORECASE).strip()
        clean_topic = re.sub(r'^(?:tell\s+me\s+about|give\s+me\s+info\s+on|explain|what\s+is|how\s+does|teach\s+me\s+about|describe)\s+', '', clean_topic, flags=re.IGNORECASE).strip()
        if not clean_topic:
            clean_topic = raw.rstrip('.!? ')

        lower_raw = raw.lower()
        if any(k in lower_raw for k in ['email', 'letter', 'memo', 'message to', 'manager', 'boss', 'leave', 'pto']):
            optimized = f"Write a concise, professional email regarding {clean_topic}. Include context, key request details, and clear next steps."
            reasoning = "Added essential email structure (context, key details, next steps) and concise formatting."
            changes = ["Added clear email structural guidelines", "Specified concise professional tone"]
        elif any(k in lower_raw for k in ['code', 'python', 'java', 'react', 'function', 'class', 'algorithm', 'binary search', 'sql', 'debug', 'script']):
            optimized = f"Implement a clean, robust solution for {clean_topic}. Include modular code, concise comments, and time/space complexity analysis."
            reasoning = "Added implementation requirements, code quality standards, and complexity analysis."
            changes = ["Added modular code and commenting requirements", "Specified complexity analysis"]
        elif any(k in lower_raw for k in ['analyze', 'analysis', 'review', 'complaint', 'feedback', 'compare']):
            optimized = f"Analyze {clean_topic} to identify core themes, key findings, and 3 actionable recommendations."
            reasoning = "Added clear analysis structure with core themes, key findings, and actionable recommendations."
            changes = ["Structured analysis into key findings and actionable recommendations"]
        else:
            optimized = f"Explain {clean_topic} in 5 concise bullet points, covering its main causes, effects, and one real-world example. Use simple language."
            reasoning = "Structured topic into concise bullet points with cause/effect/example scope to prevent vague generation."
            changes = ["Structured request into 5 concise bullet points", "Added cause, effect, and real-world example scope"]

        return {
            "optimizedPrompt": optimized,
            "reasoning": reasoning,
            "changes": changes,
            "neededOptimization": True
        }

    # 3. Medium or Large Prompts: Deduplicate, Consolidate & Clean Filler
    cleaned_filler, had_filler = clean_conversational_filler(raw)
    consolidated, dedup_changes = consolidate_repetitive_prompt(raw)

    changes = []
    if had_filler:
        changes.append("Removed conversational filler and polite preambles")
    changes.extend([c for c in dedup_changes if c not in changes])

    # If no changes were made or needed
    if consolidated.strip() == raw.strip() or (not changes and len(consolidated) >= len(raw) * 0.95):
        return {
            "optimizedPrompt": raw,
            "reasoning": "Prompt is already well-structured. Preserved original with no major changes needed.",
            "changes": ["Preserved prompt structure and constraints without unnecessary modifications."],
            "neededOptimization": False
        }

    reasoning_parts = []
    if any("duplicate" in c.lower() or "consolidated" in c.lower() for c in changes):
        reasoning_parts.append("consolidated duplicate requirements")
    if had_filler:
        reasoning_parts.append("removed conversational filler")
    if any("structured" in c.lower() for c in changes):
        reasoning_parts.append("organized into structured requirements")
    if not reasoning_parts:
        reasoning_parts.append("streamlined instruction clarity")

    reasoning = f"Optimized prompt: {', '.join(reasoning_parts).capitalize()} while preserving all original context and constraints."

    return {
        "optimizedPrompt": consolidated,
        "reasoning": reasoning,
        "changes": changes if changes else ["Cleaned phrasing and preserved all core constraints."],
        "neededOptimization": True
    }


async def query_ollama_optimizer(prompt: str, quality_score: float = 50.0, task_type: str = 'other') -> dict:
    """
    Optimizes a user prompt using the configured LLM client with intelligent fallback.
    Enforces core optimization principles:
    - Preserves user intent, domain facts, code, and necessary context.
    - Does NOT rewrite/paraphrase for the sake of rewriting.
    - Deduplicates requirements and removes filler for large prompts.
    - Adds structure and specificity for short vague prompts.
    - Preserves already well-structured prompts without artificial changes.
    """
    prompt_template = (
        "You are EcoRoute's Expert Prompt Optimization Engine.\n"
        "Your task is to optimize the user's prompt to maximize instruction clarity, structural precision, and compute efficiency WITHOUT simply paraphrasing or rewriting the text.\n\n"
        "OPTIMIZATION RULES:\n"
        "1. PRESERVE INTENT & CRITICAL CONTEXT: Retain the user's core goal, domain facts, technical constraints, variables, code snippets, and data. Do NOT delete necessary information just to make the prompt shorter.\n"
        "2. DO NOT PARAPHRASE: Meaningfully modify the prompt ONLY when there is something genuine to improve. If an instruction is already clear and concise, keep it.\n"
        "3. FOR SHORT PROMPTS (e.g. 'Tell me about climate change.'): Identify missing structure or specificity. Add concise scoping (e.g., 5 concise bullet points covering causes, effects, and one real-world example) without arbitrary unneeded requirements.\n"
        "4. FOR LARGE / REPETITIVE PROMPTS: Consolidate duplicate requirements, remove polite conversational filler ('could you please', 'I was wondering if...'), eliminate conflicting instructions, and structure cleanly with headings or bullet points while keeping all necessary information intact.\n"
        "5. FOR WELL-STRUCTURED PROMPTS: If the prompt is already clear, well-structured, and contains no fluff or repetition, preserve it as-is and explain that it was already well-structured.\n\n"
        "Respond ONLY with a single valid raw JSON object:\n"
        "{\n"
        '  "optimizedPrompt": "the optimized prompt text (or original if already optimal)",\n'
        '  "reasoning": "A concise 1-2 sentence explanation of why changes were made or why prompt was preserved (e.g., \'Removed repeated requirements, consolidated formatting instructions, and converted request into structured task.\' or \'Prompt is already well-structured. Preserved original with no major changes needed.\')",\n'
        '  "changes": ["description of improvement 1", "description of improvement 2"],\n'
        '  "neededOptimization": true\n'
        "}\n\n"
        f"User Prompt to Optimize:\n{prompt}"
    )

    try:
        raw_text = await query_llm(prompt_template)
        data = json.loads(raw_text)
        if isinstance(data, dict) and data.get("optimizedPrompt"):
            cleaned_opt, was_leaked = sanitize_optimized_prompt(prompt, data["optimizedPrompt"])
            if not was_leaked:
                data["optimizedPrompt"] = cleaned_opt
                if not data.get("reasoning"):
                    data["reasoning"] = "Optimized prompt for instruction clarity and compute efficiency."
                if not isinstance(data.get("changes"), list):
                    data["changes"] = [str(data.get("changes"))] if data.get("changes") else []
                return data
    except Exception:
        pass

    # Deterministic fallback optimizer
    return optimize_prompt_intelligently(prompt, quality_score, task_type)


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
        changes = [str(changes)] if changes else []

    reasoning = result.get("reasoning", "")
    needed_opt = result.get("neededOptimization", True)

    # Safeguard: if leaked or empty, run fallback
    if was_leaked or not cleaned_prompt:
        fallback_res = optimize_prompt_intelligently(original, quality, task)
        cleaned_prompt = fallback_res.get("optimizedPrompt", original)
        changes = fallback_res.get("changes", [])
        reasoning = fallback_res.get("reasoning", reasoning)
        needed_opt = fallback_res.get("neededOptimization", True)

    # If prompt is identical to original, check if it genuinely needed no changes
    if cleaned_prompt.strip() == original.strip():
        if not reasoning or "optimized" in reasoning.lower():
            reasoning = "Prompt is already well-structured. Preserved original with no major changes needed."
        needed_opt = False
        if not changes:
            changes = ["Prompt structure and constraints are already optimal."]

    token_stats = calculate_token_savings(original, cleaned_prompt)

    return OptimizeResponse(
        originalPrompt=original,
        optimizedPrompt=cleaned_prompt,
        reasoning=reasoning,
        changes=changes,
        neededOptimization=needed_opt,
        tokensBefore=token_stats["tokensBefore"],
        tokensAfter=token_stats["tokensAfter"],
        tokenReduction=token_stats["tokenReduction"],
        tokenReductionPercentage=token_stats["tokenReductionPercentage"]
    )
