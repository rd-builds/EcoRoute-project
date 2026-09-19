"""
impact.py — EcoRoute Prompt Quality Score & Resource Impact Module
-------------------------------------------------------------------
Provides:
1. Green Score calculation (0-100), representing prompt quality, clarity, and effectiveness.
2. Estimated relative resource demand classification (energy, water, carbon).
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Literal

router = APIRouter()

TierLevel = Literal["nano", "small", "medium", "large"]
RiskLevel = Literal["low", "medium", "high"]


# ===========================================================================
# 1. Green Score Models & Functions
# ===========================================================================

class ScoreRequest(BaseModel):
    qualityScore: Optional[float] = 70.0
    tokenReductionPercentage: Optional[float] = 0.0
    modelTier: Optional[TierLevel] = "small"
    complexity: Optional[RiskLevel] = "medium"
    slopRisk: Optional[RiskLevel] = "low"
    repetitionRisk: Optional[RiskLevel] = "low"
    outputBloat: Optional[RiskLevel] = "low"
    regenerationRisk: Optional[RiskLevel] = "low"


class Breakdown(BaseModel):
    promptQuality: float
    modelEfficiency: float
    generationEfficiency: float


class ScoreResponse(BaseModel):
    greenScore: float
    breakdown: Breakdown


def compute_green_score(request: ScoreRequest) -> tuple[float, dict]:
    """
    Computes the primary Green Score (0-100) reflecting PROMPT QUALITY, clarity, and usefulness.
    PROMPT QUALITY != PROMPT LENGTH
    """
    quality = request.qualityScore if request.qualityScore is not None else 70.0
    
    # Generation efficiency deduction if significant repetition / bloat risk exists
    gen_penalty = 0.0
    if request.slopRisk == "high":
        gen_penalty += 10.0
    elif request.slopRisk == "medium":
        gen_penalty += 4.0

    if request.repetitionRisk == "high":
        gen_penalty += 8.0

    final_score = round(min(max(quality - gen_penalty, 10.0), 99.0), 1)

    model_eff_map = {
        "nano": 95.0,
        "small": 88.0,
        "medium": 65.0,
        "large": 45.0,
    }
    model_eff = model_eff_map.get(request.modelTier or "small", 85.0)

    breakdown = {
        "promptQuality": quality,
        "modelEfficiency": model_eff,
        "generationEfficiency": max(100.0 - (gen_penalty * 4.0), 0.0)
    }
    return final_score, breakdown


@router.post("/score", response_model=ScoreResponse)
def get_green_score_endpoint(request: ScoreRequest):
    overall, breakdown_dict = compute_green_score(request)
    return ScoreResponse(
        greenScore=overall,
        breakdown=Breakdown(**breakdown_dict)
    )


# ===========================================================================
# 2. Resource Demand Impact Estimation Models & Functions
# ===========================================================================

class ImpactRequest(BaseModel):
    modelTier: Optional[TierLevel] = "small"
    complexity: Optional[RiskLevel] = "medium"
    estimatedTokens: Optional[int] = 500
    outputBloat: Optional[RiskLevel] = "low"
    repetitionRisk: Optional[RiskLevel] = "low"


class ImpactResponse(BaseModel):
    energy: RiskLevel
    water: RiskLevel
    carbon: RiskLevel


def estimate_relative_resource_impact(request: ImpactRequest) -> dict:
    """
    Computes relative compute load based on model size, output bloat, and task complexity.
    """
    base_weights = {
        "nano": 1.0,
        "small": 2.0,
        "medium": 5.0,
        "large": 8.0
    }
    compute_weight = base_weights.get(request.modelTier or "small", 2.0)

    # Token / Output Volume Multiplier
    tokens = request.estimatedTokens or 500
    if request.outputBloat == "high" or tokens >= 3000:
        volume_mult = 2.5
    elif request.outputBloat == "medium" or tokens >= 1000:
        volume_mult = 1.6
    else:
        volume_mult = 1.0

    # Complexity Multiplier
    complexity_mult = 1.5 if request.complexity == "high" else (1.2 if request.complexity == "medium" else 0.8)

    relative_load_index = compute_weight * volume_mult * complexity_mult

    if relative_load_index < 3.5:
        level: RiskLevel = "low"
    elif relative_load_index < 9.0:
        level: RiskLevel = "medium"
    else:
        level: RiskLevel = "high"

    return {
        "energy": level,
        "water": level,
        "carbon": level
    }


@router.post("/impact", response_model=ImpactResponse)
def estimate_impact_endpoint(request: ImpactRequest):
    result = estimate_relative_resource_impact(request)
    return ImpactResponse(**result)
