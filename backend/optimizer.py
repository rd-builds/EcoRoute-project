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

    # Detect suspicious length expansion (unreasonably massive)
    if len(optimized_prompt) > max(len(original_prompt) * 5.0, len(original_prompt) + 500):
        return original_prompt, True

    return optimized_prompt.strip(), False


def clean_filler(text: str) -> str:
    """Removes conversational filler, polite preambles, and low-value leading phrases."""
    cleaned = text.strip()
    filler_patterns = [
        r'^(?:could|can|would|will)\s+you\s+(?:please\s+)?(?:kindly\s+)?(?:help\s+me\s+)?(?:to\s+)?',
        r'^(?:please|kindly)\s+',
        r'^(?:i\s+(?:was\s+wondering\s+if\s+you\s+could|would\s+like\s+you\s+to|want\s+you\s+to|need\s+you\s+to|am\s+asking\s+you\s+to|was\s+hoping\s+you\s+could))\s+',
        r'^(?:tell\s+me\s+about|give\s+me\s+info(?:rmation)?\s+on|i\s+need\s+to\s+know\s+about|give\s+me\s+a\s+summary\s+of)\s+',
        r'^(?:write|draft)\s+a?\s*(?:quick|short|simple)?\s*',
    ]
    for pattern in filler_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()
    return cleaned if cleaned else text


def optimize_prompt_intelligently(prompt: str, quality_score: float = 50.0, task_type: str = 'other') -> Tuple[str, List[str]]:
    """
    Intelligently optimizes prompts dynamically for any input:
    - Removes conversational filler, preambles, and redundant phrasing.
    - Adds explicit structural guidelines (sections, headings, bullet points).
    - Specifies output formatting, context requirements, and actionable scope.
    - Works dynamically across question/research, writing/communication, analysis, coding, and general tasks.
    """
    raw = prompt.strip()
    if not raw:
        return raw, []

    lower = raw.lower()
    changes = []

    # 1. Clean conversational filler & polite preambles
    cleaned = clean_filler(raw)
    if cleaned != raw and len(cleaned) > 3:
        changes.append("Removed conversational filler and polite preambles")
        work_text = cleaned
    else:
        work_text = raw

    work_lower = work_text.lower()

    # Determine core subject/topic by stripping leading prepositional filler
    topic = re.sub(r'^(?:about|on|regarding|for|the|a|an)\s+', '', work_text, flags=re.IGNORECASE).strip()
    if not topic:
        topic = work_text

    # 2. Archetype / Task Intent Classification & Optimization

    # Archetype A: Email / Writing / Communication Requests
    if task_type == 'writing' or any(k in work_lower for k in ['email', 'letter', 'memo', 'cover letter', 'essay', 'draft', 'rewrite', 'message to', 'manager', 'boss', 'professor', 'dean', 'pto', 'absence']):
        recipient = '[Recipient]'
        if 'manager' in work_lower or 'boss' in work_lower:
            recipient = 'my manager'
        elif 'professor' in work_lower:
            recipient = 'my professor'
        elif 'dean' in work_lower:
            recipient = 'the dean'

        subject_hint = work_text
        subject_hint = re.sub(r'^(?:write|draft)\s+', '', subject_hint, flags=re.IGNORECASE).strip()
        subject_hint = re.sub(r'^(?:an?\s+)?(?:email|letter|memo|note|message)\s+', '', subject_hint, flags=re.IGNORECASE).strip()
        subject_hint = re.sub(r'^(?:to\s+)?(?:my\s+)?(?:manager|boss|professor|dean)\s+', '', subject_hint, flags=re.IGNORECASE).strip()
        subject_hint = re.sub(r'^(?:about|regarding|asking\s+for|for)\s+', '', subject_hint, flags=re.IGNORECASE).strip()
        if not subject_hint or len(subject_hint) < 2:
            subject_hint = 'the requested topic'

        optimized = (
            f"Write a professional, concise email to {recipient} regarding {subject_hint}. "
            "Structure the response with a clear subject line, a respectful opening, logical body paragraphs detailing the main points and context, "
            "a polite call to action, and a formal sign-off. Use explicit placeholders like [Dates/Details] where specific information is required."
        )
        changes.append("Structured email request with professional tone, explicit placeholders, and section guidelines")
        return optimized, changes

    # Archetype B: Educational / Explanatory / Topic Query (e.g. "tell me about climate change")
    if task_type in ['education', 'summarization'] or any(k in work_lower for k in ['climate change', 'tell me about', 'explain', 'what is', 'how does', 'teach', 'overview', 'concept', 'history of', 'background of', 'understanding']):
        clean_topic = re.sub(r'^(?:tell\s+me\s+about|explain|what\s+is|how\s+does|teach\s+me\s+about|give\s+me\s+an?\s+overview\s+of)\s+', '', work_text, flags=re.IGNORECASE).strip()
        if not clean_topic:
            clean_topic = topic

        optimized = (
            f"Explain {clean_topic} in clear, concise language. "
            "Structure the response with headings covering: 1) Core Definition & Background, 2) Key Causes & Mechanisms, "
            "3) Major Effects & Current Challenges, and 4) 5 Key Bulleted Takeaways. Suitable for a clear, comprehensive overview."
        )
        changes.append("Transformed vague topic query into structured explanation with clear headings and bulleted takeaways")
        return optimized, changes

    # Archetype C: Analysis / Research / Data Extraction Requests (e.g. "Analyze customer reviews")
    if task_type == 'research' or any(k in work_lower for k in ['analyze', 'analysis', 'review', 'complaint', 'reviews', 'complaints', 'feedback', 'compare', 'evaluation', 'benchmark', 'themes', 'trends']):
        target_subject = re.sub(r'^(?:analyze|evaluate|review|compare)\s+(?:these|the|this)?\s*', '', work_text, flags=re.IGNORECASE).strip()
        target_subject = re.sub(r'\s+(?:and|to)\s+(?:identify|find|extract|discover).*$', '', target_subject, flags=re.IGNORECASE).strip()
        if not target_subject:
            target_subject = work_text

        optimized = (
            f"Analyze {target_subject} to identify recurring themes, core patterns, and actionable insights. "
            "Structure the output into: 1) Executive Summary, 2) Key Categorized Findings with Frequency/Severity, "
            "3) Representative Excerpts, and 4) Strategic Recommendations formatted with bullet points."
        )
        changes.append("Structured analysis request into executive summary, categorized findings, and strategic recommendations")
        return optimized, changes

    # Archetype D: Coding / Engineering Implementation
    if task_type == 'coding' or any(k in work_lower for k in ['code', 'program', 'debug', 'function', 'class', 'algorithm', 'script', 'react', 'python', 'java', 'js', 'javascript', 'typescript', 'sql', 'hook', 'api']):
        if any(k in work_lower for k in ['debug', 'fix', 'error', 'stacktrace', 'bug']):
            optimized = (
                f"Debug the following technical issue with {work_text}: [Paste code/stacktrace here]. "
                "1) Identify the root cause, 2) Provide the corrected production-ready code snippet, and 3) List best practices to prevent similar errors."
            )
            changes.append("Structured debugging prompt with root-cause analysis, corrected code block, and best practices")
        else:
            optimized = (
                f"Implement a clean, robust, production-ready solution for: {work_text}. "
                "Include modular code with concise comments, proper error handling, edge case considerations, and a brief explanation of time and space complexity."
            )
            changes.append("Added production requirements, edge case handling, and complexity analysis")
        return optimized, changes

    # Archetype E: Brainstorming / Idea Generation
    if task_type == 'brainstorming' or any(k in work_lower for k in ['brainstorm', 'ideas', 'suggestions', 'creative', 'names', 'strategies']):
        optimized = (
            f"Generate 5-10 distinct, highly creative, and actionable ideas for {work_text}. "
            "For each idea, include: a catchy title, a 2-sentence concept summary, key benefits, and practical implementation steps."
        )
        changes.append("Structured brainstorming prompt into distinct ideas with summary, benefits, and execution steps")
        return optimized, changes

    # Archetype F: General Fallback for arbitrary prompts
    optimized = (
        f"{work_text[0].upper() + work_text[1:] if work_text else raw}. "
        "Provide a clear, well-structured response with key headings, concise explanation, and bulleted takeaways."
    )
    changes.append("Added structural clarity, section headings, and bulleted output requirements")
    return optimized, changes


async def query_ollama_optimizer(prompt: str, quality_score: float = 50.0, task_type: str = 'other') -> dict:
    prompt_template = (
        "You are GreenMind's Expert Prompt Optimizer. Your task is to refine the user's prompt into an optimized, highly effective LLM prompt.\n\n"
        "OPTIMIZATION RULES:\n"
        "1. Remove conversational filler and polite preambles (e.g. 'could you please', 'tell me about').\n"
        "2. Add clear structural requirements (e.g. headings, bullet points, executive summary, sections).\n"
        "3. Specify output style, target audience, context, and explicit placeholders like [Details] when needed.\n"
        "4. Do NOT fabricate unstated facts. Preserve the user's core intent while maximizing prompt quality and clarity.\n\n"
        "Respond ONLY with a single valid JSON object:\n"
        "{\n"
        '  "optimizedPrompt": "the refined, highly structured prompt",\n'
        '  "changes": ["description of improvement 1", "description of improvement 2"]\n'
        "}\n\n"
        f"User Prompt to Optimize: {prompt}"
    )

    try:
        raw_text = await query_llm(prompt_template)
        data = json.loads(raw_text)
        if data.get("optimizedPrompt") and data.get("optimizedPrompt").strip() != prompt.strip():
            return data
    except Exception:
        pass

    # Deterministic intelligent fallback optimizer
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

    if was_leaked or cleaned_prompt.strip() == original.strip():
        cleaned_prompt, changes = optimize_prompt_intelligently(original, quality, task)

    return OptimizeResponse(
        optimizedPrompt=cleaned_prompt,
        changes=changes
    )

