"""
impact.py — GreenMind Environmental Impact & Green Score Module
--------------------------------------------------------------
Provides:
1. Green Score calculation (internal relative efficiency index, 0-100).
2. Estimated relative resource demand classification (energy, water, carbon).

METHODOLOGY & ASSUMPTIONS:
- Resource demand tiers ("low", "medium", "high") reflect relative compute intensity.
- We do NOT claim exact grams of CO2 or liters of water because datacenter PUE,
  regional grid carbon intensity (gCO2/kWh), and cooling Water Usage Effectiveness (WUE)
  vary drastically by location and hardware.
- The modular architecture allows pluggable empirical data providers (e.g. WattTime,
  CodeCarbon, or cloud provider sustainability APIs) in future versions.
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
    tokenReductionPercentage: Optional[float] = 0.0
    modelTier: Optional[TierLevel] = "small"
    complexity: Optional[RiskLevel] = "medium"
    slopRisk: Optional[RiskLevel] = "low"
    repetitionRisk: Optional[RiskLevel] = "low"
    outputBloat: Optional[RiskLevel] = "low"
    regenerationRisk: Optional[RiskLevel] = "low"


class Breakdown(BaseModel):
    promptEfficiency: float
    modelEfficiency: float
    generationEfficiency: float


class ScoreResponse(BaseModel):
    greenScore: float
    breakdown: Breakdown


def calculate_prompt_efficiency(reduction_pct: float) -> float:
    if reduction_pct <= 0:
        return 70.0
    score = 70.0 + (reduction_pct / 50.0) * 30.0
    return round(min(score, 100.0), 1)


def calculate_model_efficiency(model_tier: str, complexity: str) -> float:
    matrix = {
        "nano": {"low": 100.0, "medium": 100.0, "high": 100.0},
        "small": {"low": 90.0, "medium": 90.0, "high": 85.0},
        "medium": {"low": 50.0, "medium": 50.0, "high": 75.0},
        "large": {"low": 20.0, "medium": 40.0, "high": 65.0},
    }
    tier_scores = matrix.get(model_tier, matrix["small"])
    return tier_scores.get(complexity, 80.0)


def calculate_generation_efficiency(
    slop_risk: str,
    repetition_risk: str,
    output_bloat: str,
    regeneration_risk: str
) -> float:
    score = 100.0
    if slop_risk == "high":
        score -= 25.0
    elif slop_risk == "medium":
        score -= 10.0

    if repetition_risk == "high":
        score -= 20.0
    elif repetition_risk == "medium":
        score -= 10.0

    if output_bloat == "high":
        score -= 20.0
    elif output_bloat == "medium":
        score -= 10.0

    if regeneration_risk == "high":
        score -= 15.0
    elif regeneration_risk == "medium":
        score -= 5.0

    return round(max(score, 0.0), 1)


def compute_green_score(request: ScoreRequest) -> tuple[float, dict]:
    prompt_eff = calculate_prompt_efficiency(request.tokenReductionPercentage or 0.0)
    model_eff = calculate_model_efficiency(
        request.modelTier or "small",
        request.complexity or "medium"
    )
    gen_eff = calculate_generation_efficiency(
        request.slopRisk or "low",
        request.repetitionRisk or "low",
        request.outputBloat or "low",
        request.regenerationRisk or "low"
    )

    total_score = (0.35 * prompt_eff) + (0.35 * model_eff) + (0.30 * gen_eff)
    rounded_total = round(min(max(total_score, 0.0), 100.0), 1)

    breakdown = {
        "promptEfficiency": prompt_eff,
        "modelEfficiency": model_eff,
        "generationEfficiency": gen_eff
    }
    return rounded_total, breakdown


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
    Computes relative compute load based on model size, output bloat, and repetition.
    
    Modular Strategy:
    - Base compute factor derived from model size tier:
        nano: 1.0, small: 2.0, medium: 5.0, large: 8.0
    - Multipliers for output bloat and repetition.
    - Classifies resulting load index into low / medium / high tiers.
    """
    # 1. Base model compute weight
    base_weights = {
        "nano": 1.0,
        "small": 2.0,
        "medium": 5.0,
        "large": 8.0
    }
    compute_weight = base_weights.get(request.modelTier or "small", 2.0)

    # 2. Token / Output Volume Multiplier
    tokens = request.estimatedTokens or 500
    if request.outputBloat == "high" or tokens >= 3000:
        volume_mult = 3.0
    elif request.outputBloat == "medium" or tokens >= 1000:
        volume_mult = 1.8
    else:
        volume_mult = 1.0

    # 3. Repetition Multiplier
    if request.repetitionRisk == "high":
        rep_mult = 2.0
    elif request.repetitionRisk == "medium":
        rep_mult = 1.3
    else:
        rep_mult = 1.0

    # Aggregate Load Index
    relative_load_index = compute_weight * volume_mult * rep_mult

    # Classification Thresholds
    if relative_load_index < 4.0:
        level: RiskLevel = "low"
    elif relative_load_index < 12.0:
        level: RiskLevel = "medium"
    else:
        level: RiskLevel = "high"

    # In current proxy baseline, energy, water, and carbon correlate directly
    # with relative compute load.
    return {
        "energy": level,
        "water": level,
        "carbon": level
    }


@router.post("/impact", response_model=ImpactResponse)
def estimate_impact_endpoint(request: ImpactRequest):
    result = estimate_relative_resource_impact(request)
    return ImpactResponse(**result)
