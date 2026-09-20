import os
import json
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

# Import helper functions from GreenMind / EcoRoute modules
from llm_client import query_llm
from classifier import classify_task_type, evaluate_prompt_quality, evaluate_complexity, evaluate_ai_necessity
from optimizer import query_ollama_optimizer, optimize_prompt_intelligently, sanitize_optimized_prompt
from token_counter import calculate_token_savings
from slop_detector import run_slop_detection, detect_ai_necessity
from recommender import select_tier, _TIER_BY_NAME, build_reason
from impact import ScoreRequest, compute_green_score, ImpactRequest, estimate_relative_resource_impact

router = APIRouter()


# ---------------------------------------------------------------------------
# Request and Response Models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="The user prompt to analyze")
    task: Optional[str] = None
    currentAI: Optional[str] = None
    history: Optional[List[str]] = []


class AINecessityDetail(BaseModel):
    status: str
    confidence: float
    reason: str
    alternative: Optional[str] = None


class SlopDetail(BaseModel):
    risk: str
    repetitionRisk: str
    outputBloat: str
    regenerationRisk: str
    reason: str
    suggestion: str
    slopRiskExplanation: Optional[str] = None
    repetitionRiskExplanation: Optional[str] = None
    outputBloatExplanation: Optional[str] = None
    regenerationRiskExplanation: Optional[str] = None


class ImpactDetail(BaseModel):
    energy: str
    water: str
    carbon: str


class AnalyzeResponse(BaseModel):
    originalPrompt: Optional[str] = None
    optimizedPrompt: str
    reasoning: Optional[str] = None
    changes: Optional[List[str]] = []
    taskType: str
    complexity: str
    aiNecessity: AINecessityDetail
    slop: SlopDetail
    recommendedModel: str
    reason: str
    tokensBefore: int
    tokensAfter: int
    tokenReduction: int
    tokenReductionPercentage: float
    greenScore: float
    impact: ImpactDetail


# ---------------------------------------------------------------------------
# Integrated /analyze Endpoint
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_prompt_endpoint(request: AnalyzeRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    prompt = request.prompt
    history = request.history or []

    # 1. AI Necessity Check (BEFORE existing optimization pipeline)
    necessity_res = evaluate_ai_necessity(prompt)
    ai_necessity_detail = AINecessityDetail(**necessity_res)
    task_type = classify_task_type(prompt, request.task)

    # If AI is NOT required, bypass unnecessary LLM optimization
    if necessity_res["status"] == "AI_NOT_REQUIRED":
        token_stats = calculate_token_savings(prompt, prompt)
        slop_detail = SlopDetail(
            risk="low",
            repetitionRisk="low",
            outputBloat="low",
            regenerationRisk="low",
            reason="This task can be solved using non-AI tools or local computation.",
            suggestion=necessity_res.get("alternative") or "Use a calculator or non-AI tool."
        )
        impact_detail = ImpactDetail(
            energy="low",
            water="low",
            carbon="low"
        )
        return AnalyzeResponse(
            originalPrompt=prompt,
            optimizedPrompt=prompt,
            reasoning="AI is not required for deterministic calculation or local formatting.",
            changes=["Bypassed LLM inference; task can be solved deterministically."],
            taskType=task_type,
            complexity="low",
            aiNecessity=ai_necessity_detail,
            slop=slop_detail,
            recommendedModel="Non-AI / Local Tool",
            reason="This task can be solved reliably without an LLM. EcoRoute skipped unnecessary LLM optimization.",
            tokensBefore=token_stats["tokensBefore"],
            tokensAfter=token_stats["tokensBefore"],
            tokenReduction=0,
            tokenReductionPercentage=0.0,
            greenScore=100.0,
            impact=impact_detail
        )

    # 2. For AI_OPTIONAL and AI_REQUIRED: continue optimization pipeline
    quality_score, quality_breakdown = evaluate_prompt_quality(prompt, task_type)
    complexity = evaluate_complexity(prompt, task_type, quality_score)

    try:
        optimizer_task = query_ollama_optimizer(prompt, quality_score, task_type)
        slop_task = run_slop_detection(prompt, history, quality_score)

        optimizer_res, slop_res = await asyncio.gather(
            optimizer_task, slop_task
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

    optimized_prompt = optimizer_res.get("optimizedPrompt", prompt)
    reasoning = optimizer_res.get("reasoning", "")
    changes = optimizer_res.get("changes", [])
    needed_opt = optimizer_res.get("neededOptimization", True)

    if not isinstance(changes, list):
        changes = [str(changes)] if changes else []

    # Safeguard: if empty or leaked, fallback to deterministic optimizer
    cleaned_opt, was_leaked = sanitize_optimized_prompt(prompt, optimized_prompt)
    if was_leaked or not cleaned_opt:
        fallback_res = optimize_prompt_intelligently(prompt, quality_score, task_type)
        optimized_prompt = fallback_res.get("optimizedPrompt", prompt)
        reasoning = fallback_res.get("reasoning", reasoning)
        changes = fallback_res.get("changes", changes)
        needed_opt = fallback_res.get("neededOptimization", True)
    else:
        optimized_prompt = cleaned_opt

    # If prompt is identical to original, check if it genuinely needed no changes
    if optimized_prompt.strip() == prompt.strip():
        if not reasoning or "optimized" in reasoning.lower():
            reasoning = "Prompt is already well-structured. Preserved original with no major changes needed."
        if not changes:
            changes = ["Prompt structure and constraints are already optimal."]

    # 3. Calculate token metrics from the actual strings
    token_stats = calculate_token_savings(prompt, optimized_prompt)

    # 4. Generate model recommendation based on task type and complexity
    mapped_necessity_level = "medium" if necessity_res["status"] == "AI_OPTIONAL" else "high"
    rec_tier = select_tier(task_type, complexity, mapped_necessity_level)
    rec_entry = _TIER_BY_NAME.get(rec_tier, _TIER_BY_NAME["small"])
    rec_reason = build_reason(rec_entry, task_type, complexity, mapped_necessity_level)

    # 5. Calculate Green Score (0-100) reflecting true Prompt Quality
    score_req = ScoreRequest(
        qualityScore=quality_score,
        tokenReductionPercentage=token_stats["tokenReductionPercentage"],
        modelTier=rec_tier,
        complexity=complexity,
        slopRisk=slop_res["risk"],
        repetitionRisk=slop_res["repetitionRisk"],
        outputBloat=slop_res["outputBloat"],
        regenerationRisk=slop_res["regenerationRisk"]
    )
    green_score, _ = compute_green_score(score_req)

    # 6. Estimate Relative Resource Impact
    impact_req = ImpactRequest(
        modelTier=rec_tier,
        complexity=complexity,
        estimatedTokens=token_stats["tokensAfter"],
        outputBloat=slop_res["outputBloat"],
        repetitionRisk=slop_res["repetitionRisk"]
    )
    impact_stats = estimate_relative_resource_impact(impact_req)

    # 7. Construct final structured response
    slop_detail = SlopDetail(
        risk=slop_res["risk"],
        repetitionRisk=slop_res["repetitionRisk"],
        outputBloat=slop_res["outputBloat"],
        regenerationRisk=slop_res["regenerationRisk"],
        reason=slop_res["reason"],
        suggestion=slop_res["suggestion"],
        slopRiskExplanation=slop_res.get("slopRiskExplanation"),
        repetitionRiskExplanation=slop_res.get("repetitionRiskExplanation"),
        outputBloatExplanation=slop_res.get("outputBloatExplanation"),
        regenerationRiskExplanation=slop_res.get("regenerationRiskExplanation")
    )

    impact_detail = ImpactDetail(
        energy=impact_stats["energy"],
        water=impact_stats["water"],
        carbon=impact_stats["carbon"]
    )

    return AnalyzeResponse(
        originalPrompt=prompt,
        optimizedPrompt=optimized_prompt,
        reasoning=reasoning,
        changes=changes,
        taskType=task_type,
        complexity=complexity,
        aiNecessity=ai_necessity_detail,
        slop=slop_detail,
        recommendedModel=rec_entry["name"],
        reason=rec_reason,
        tokensBefore=token_stats["tokensBefore"],
        tokensAfter=token_stats["tokensAfter"],
        tokenReduction=token_stats["tokenReduction"],
        tokenReductionPercentage=token_stats["tokenReductionPercentage"],
        greenScore=green_score,
        impact=impact_detail
    )