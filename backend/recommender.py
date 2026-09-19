"""
recommender.py — GreenMind Model Recommender
---------------------------------------------
Recommends a resource-appropriate AI model based on task characteristics.

Design principles:
- Prefer the lowest-compute capable model that can fulfill the request.
- Selection is fully deterministic (no LLM call) — fast, reliable, demo-safe.
- Clear model availability (Local vs. Cloud API).
- Does NOT make energy/water claims — only capability-based recommendations.
- The recommendation is a suggestion, not an absolute ranking.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

router = APIRouter()

# ---------------------------------------------------------------------------
# Model Catalogue
# ---------------------------------------------------------------------------
CATALOGUE = [
    {
        "tier": "nano",
        "name": "qwen3:0.6b",
        "available_via": "Ollama (Local)",
        "suited_for": [
            "simple factual questions",
            "basic text transformations",
            "low-complexity tasks",
        ],
    },
    {
        "tier": "small",
        "name": "mistral-7b-instruct",
        "available_via": "Ollama (Local) / Cloud API",
        "suited_for": [
            "medium-complexity coding & bug fixes",
            "general writing & editing",
            "standard summarization",
            "educational explanations",
        ],
    },
    {
        "tier": "medium",
        "name": "llama3.1:70b",
        "available_via": "Cloud API / High-VRAM Local",
        "suited_for": [
            "high-complexity technical tasks",
            "deep code refactoring",
            "advanced multi-topic synthesis",
        ],
    },
    {
        "tier": "large",
        "name": "claude-3.5-sonnet",
        "available_via": "Cloud API (Anthropic)",
        "suited_for": [
            "high-complexity research & analysis",
            "complex multi-file system design",
            "frontier reasoning tasks",
        ],
    },
]

_TIER_BY_NAME = {entry["tier"]: entry for entry in CATALOGUE}

# ---------------------------------------------------------------------------
# Refined Selection Logic
# ---------------------------------------------------------------------------
def select_tier(task_type: str, complexity: str, ai_necessity: str) -> str:
    """
    Deterministically maps task parameters to the minimum capable model tier.
    
    Rules:
    - low aiNecessity -> 'nano' (AI is hardly needed)
    - low complexity -> 'nano' (or 'small' if high aiNecessity)
    - medium complexity -> 'small' (7B model handles medium coding/writing cleanly)
    - high complexity -> 'medium' (70B) or 'large' (frontier cloud) for complex research/coding
    """
    if ai_necessity == "low":
        return "nano"

    if complexity == "low":
        return "small" if ai_necessity == "high" else "nano"
    
    if complexity == "medium":
        return "small"

    # High complexity tasks
    if task_type in ("coding", "research") and ai_necessity == "high":
        return "large"
    
    return "medium"


def build_reason(entry: dict, task_type: str, complexity: str, ai_necessity: str) -> str:
    """
    Constructs a clear, non-prescriptive recommendation explanation.
    """
    suited = ", ".join(entry["suited_for"])
    via = entry["available_via"]

    return (
        f"Task classified as {complexity} complexity with {ai_necessity} AI necessity ({task_type}). "
        f"Recommended model: {entry['name']} ({via}), which is capable of handling {suited}. "
        f"This recommendation suggests the lowest-compute model tier suitable for the request."
    )

# ---------------------------------------------------------------------------
# Pydantic Models & Endpoint
# ---------------------------------------------------------------------------
TaskType = Literal["coding", "writing", "research", "summarization",
                   "brainstorming", "education", "other"]
Level = Literal["low", "medium", "high"]

class RecommendRequest(BaseModel):
    taskType: TaskType
    complexity: Level
    aiNecessity: Level

class RecommendResponse(BaseModel):
    recommendedModel: str
    reason: str

@router.post("/recommend", response_model=RecommendResponse)
def recommend_endpoint(request: RecommendRequest):
    tier = select_tier(
        task_type=request.taskType,
        complexity=request.complexity,
        ai_necessity=request.aiNecessity,
    )

    entry = _TIER_BY_NAME.get(tier)
    if not entry:
        raise HTTPException(status_code=500, detail=f"Unknown model tier: {tier}")

    reason = build_reason(
        entry=entry,
        task_type=request.taskType,
        complexity=request.complexity,
        ai_necessity=request.aiNecessity,
    )

    return RecommendResponse(
        recommendedModel=entry["name"],
        reason=reason,
    )
