"""
slop_detector.py — GreenMind Efficiency & Slop Risk Detector
-------------------------------------------------------------
Architecture:
  Layer 1 (Python rules): Deterministically classifies repetitionRisk,
    outputBloat, aiNecessity, ambiguityRisk, and regenerationRisk from the prompt text
    and optional session history.

  Layer 2 (LLM): Given the computed scores, generates a short
    human-readable `reason` and a practical `suggestion` when risks exist.
"""

import os
import re
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from llm_client import query_llm

router = APIRouter()

RISK_WEIGHT = {"low": 1, "medium": 2, "high": 3}
RISK_LABEL  = {1: "low", 2: "medium", 3: "high"}


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class SlopRequest(BaseModel):
    prompt: str
    history: Optional[List[str]] = []
    qualityScore: Optional[float] = 50.0


class SlopResponse(BaseModel):
    risk: str
    repetitionRisk: str
    outputBloat: str
    aiNecessity: str
    regenerationRisk: str
    reason: str
    suggestion: str


# ---------------------------------------------------------------------------
# Layer 1 — Deterministic Python rules
# ---------------------------------------------------------------------------

_VARIATION_WORDS = (
    r"captions?|versions?|variations?|options?|ideas?|alternatives?|"
    r"rewrites?|examples?|copies|formats?|phrasings?|drafts?|headlines?|"
    r"titles?|taglines?|slogans?|tweets?|posts?"
)

_QUALIFIER = r"(?:different|unique|various|distinct|separate|creative|new|more)?\s*"

_REPETITION_PATTERN = re.compile(
    rf"\b(\d+)\s+{_QUALIFIER}(?:\w+\s+){{0,2}}(?:{_VARIATION_WORDS})\b",
    re.IGNORECASE,
)

def detect_repetition_risk(prompt: str) -> tuple[str, str]:
    matches = _REPETITION_PATTERN.findall(prompt)
    if not matches:
        return "low", ""

    max_count = max(int(m) for m in matches)
    if max_count >= 10:
        return "high", f"Request asks for {max_count} similar outputs at once."
    if max_count >= 5:
        return "medium", f"Request asks for {max_count} similar outputs at once."
    return "low", ""


_WORD_COUNT_PATTERN = re.compile(
    r"\b(\d[\d,]*)[-\s]+(?:word|character|char|page|sentence|paragraph)s?\b",
    re.IGNORECASE,
)

def detect_output_bloat(prompt: str) -> tuple[str, str]:
    matches = _WORD_COUNT_PATTERN.findall(prompt)
    if not matches:
        return "low", ""

    max_count = max(int(m.replace(",", "")) for m in matches)
    if max_count >= 5000:
        return "high", f"Explicit request for {max_count:,} units of output."
    if max_count >= 2000:
        return "medium", f"Explicit request for {max_count:,} units of output."
    return "low", ""


_LOW_NECESSITY_PATTERNS = [
    re.compile(r"\b\d+\s*[\+\-\*\/]\s*\d+\b"),
    re.compile(r"\b(capitalize|uppercase|lowercase|reverse)\b.{0,40}$", re.IGNORECASE),
    re.compile(r"what\s+is\s+\d+\s+(plus|minus|times|divided\s+by)\s+\d+", re.IGNORECASE),
    re.compile(r"\bwhat\s+(day|date|time|year)\s+is\b", re.IGNORECASE),
]

_HIGH_NECESSITY_PATTERNS = [
    re.compile(r"\b(debug|fix|diagnose|troubleshoot)\b", re.IGNORECASE),
    re.compile(r"\b(write|generate|create|implement|build)\s+.{0,20}(code|script|function|class|api|component|algorithm)\b", re.IGNORECASE),
    re.compile(r"\b(research|analyse|analyze|summarize|compare|evaluate)\b", re.IGNORECASE),
    re.compile(r"\b(explain|teach|describe)\s.{0,30}(concept|theory|system|architecture)\b", re.IGNORECASE),
]

def detect_ai_necessity(prompt: str) -> tuple[str, str]:
    for pattern in _LOW_NECESSITY_PATTERNS:
        if pattern.search(prompt):
            return "low", "Task appears solvable without AI assistance."

    for pattern in _HIGH_NECESSITY_PATTERNS:
        if pattern.search(prompt):
            return "high", "Task involves complex generation or reasoning where AI adds significant value."

    return "medium", "Task has moderate AI value."


def detect_ambiguity_risk(prompt: str, quality_score: float = 50.0) -> tuple[str, str]:
    words = [w for w in re.findall(r'\b\w+\b', prompt.strip())]
    if quality_score < 40 and len(words) <= 5:
        return "high", "High ambiguity: vague or incomplete prompt triggers generic or irrelevant generation."
    if quality_score < 60 and len(words) <= 8:
        return "medium", "Moderate ambiguity: missing key context or formatting specifications."
    return "low", ""


_REGEN_KEYWORDS = re.compile(
    r"\b(another|again|regenerate|redo|one\s+more|try\s+again|different\s+version|"
    r"new\s+version|rewrite\s+this|redo\s+this|once\s+more)\b",
    re.IGNORECASE,
)

def detect_regeneration_risk(prompt: str, history: List[str], ambiguity_risk: str = "low") -> tuple[str, str]:
    current_has_regen = bool(_REGEN_KEYWORDS.search(prompt))

    if not history:
        if current_has_regen:
            return "medium", "Current request contains regeneration phrasing."
        if ambiguity_risk == "high":
            return "medium", "Ambiguous prompt is likely to require follow-up regeneration."
        return "low", ""

    history_regen_count = sum(1 for h in history if _REGEN_KEYWORDS.search(h))

    if current_has_regen and history_regen_count >= 1:
        return "high", "History shows a pattern of repeated regeneration requests."
    if current_has_regen or history_regen_count >= 2:
        return "medium", "History or current request suggests iterative regeneration."
    if history_regen_count == 1:
        return "medium", "History contains one prior regeneration-style request."

    return "low", ""


def compute_aggregate_risk(scores: dict) -> str:
    ai_nec = scores.get("aiNecessity", "medium")
    unnecessary_ai_weight = 2 if ai_nec == "low" else 1

    weights = [
        RISK_WEIGHT.get(scores.get("repetitionRisk", "low"), 1),
        RISK_WEIGHT.get(scores.get("outputBloat", "low"), 1),
        RISK_WEIGHT.get(scores.get("regenerationRisk", "low"), 1),
        RISK_WEIGHT.get(scores.get("ambiguityRisk", "low"), 1),
        unnecessary_ai_weight
    ]
    return RISK_LABEL[max(weights)]


def build_rule_based_suggestion(
    repetition_risk: str,
    output_bloat: str,
    ai_necessity: str,
    regeneration_risk: str = "low",
    ambiguity_risk: str = "low",
    overall_risk: str = "low"
) -> str:
    if ambiguity_risk == "high":
        return "Add key context, explicit requirements, or target audience to avoid ambiguous or repetitive output."
    if repetition_risk == "high":
        return "Generate 3 strong options first, review them to find the right direction, then refine a single one — rather than generating all variations at once."
    if repetition_risk == "medium":
        return "Start with 3–5 options to find the right tone or style, then expand from the best one."
    if output_bloat == "high":
        return "Start with a shorter explanation and expand only the sections that need more detail."
    if output_bloat == "medium":
        return "A focused, shorter response may serve your immediate need better. You can request more detail in a follow-up."
    if regeneration_risk in ("high", "medium"):
        return "Review previous session outputs before requesting another variation to avoid unnecessary iterative generation."
    if ai_necessity == "low":
        return "This task could be completed with a calculator, a search engine, or a simple text tool — no AI generation needed."
    return "No unnecessary generation risk detected; request is well-scoped."


# ---------------------------------------------------------------------------
# Layer 2 — LLM generates narrative only when risks are present
# ---------------------------------------------------------------------------

async def query_llm_for_narrative(
    prompt: str,
    scores: dict,
    rule_suggestion: Optional[str],
) -> dict:
    narrative_prompt = (
        "You are GreenMind's Efficiency Detector. Write a short, non-judgmental reason "
        "explaining why these generation signals were detected for the user's prompt.\n\n"
        f"User Prompt: \"{prompt}\"\n"
        f"repetitionRisk: {scores['repetitionRisk']}\n"
        f"outputBloat: {scores['outputBloat']}\n"
        f"aiNecessity: {scores['aiNecessity']}\n"
        f"regenerationRisk: {scores['regenerationRisk']}\n"
        f"ambiguityRisk: {scores['ambiguityRisk']}\n\n"
        "You MUST respond ONLY with a single valid raw JSON object matching:\n"
        "{\n"
        '  "reason": "One non-judgmental sentence describing the detected signals.",\n'
        f'  "suggestion": "{rule_suggestion or "A practical tip to reduce unnecessary generation."}"\n'
        "}\n"
    )

    try:
        raw_text = await query_llm(narrative_prompt)
        return json.loads(raw_text)
    except Exception:
        return {
            "reason": "Potential generation risks or ambiguity detected based on prompt analysis.",
            "suggestion": rule_suggestion or "Consider adding specific requirements or constraints."
        }


async def run_slop_detection(prompt: str, history: Optional[List[str]] = None, quality_score: float = 50.0) -> dict:
    history_list = history or []
    repetition_risk, rep_note  = detect_repetition_risk(prompt)
    output_bloat,    blob_note = detect_output_bloat(prompt)
    ai_necessity,    ai_note   = detect_ai_necessity(prompt)
    ambiguity_risk,  amb_note  = detect_ambiguity_risk(prompt, quality_score)
    regen_risk,      reg_note  = detect_regeneration_risk(prompt, history_list, ambiguity_risk)

    scores = {
        "repetitionRisk":   repetition_risk,
        "outputBloat":      output_bloat,
        "aiNecessity":      ai_necessity,
        "ambiguityRisk":    ambiguity_risk,
        "regenerationRisk": regen_risk,
    }

    overall_risk = compute_aggregate_risk(scores)
    rule_suggestion = build_rule_based_suggestion(repetition_risk, output_bloat, ai_necessity, regen_risk, ambiguity_risk, overall_risk)

    if overall_risk == "low":
        reason_text = "Prompt is well-scoped with no significant slop or unnecessary generation risks detected."
        suggestion_text = rule_suggestion
    else:
        narrative = await query_llm_for_narrative(prompt, scores, rule_suggestion)
        notes = list(filter(None, [amb_note, rep_note, blob_note, ai_note, reg_note]))
        reason_text = narrative.get("reason", " | ".join(notes) if notes else "Potential generation risks detected.")
        suggestion_text = rule_suggestion or narrative.get("suggestion", "Consider refining request parameters.")

    return {
        "risk": overall_risk,
        "repetitionRisk": repetition_risk,
        "outputBloat": output_bloat,
        "aiNecessity": ai_necessity,
        "regenerationRisk": regen_risk,
        "reason": reason_text,
        "suggestion": suggestion_text,
    }


@router.post("/slop-detect", response_model=SlopResponse)
async def slop_detect_endpoint(request: SlopRequest):
    data = await run_slop_detection(request.prompt, request.history or [], request.qualityScore or 50.0)
    return SlopResponse(**data)
