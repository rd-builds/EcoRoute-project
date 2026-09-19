import os
import json
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

# Import helper functions from GreenMind modules
from llm_client import query_llm
from optimizer import query_ollama_optimizer
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


class SlopDetail(BaseModel):
    risk: str
    repetitionRisk: str
    outputBloat: str
    regenerationRisk: str
    reason: str
    suggestion: str


class ImpactDetail(BaseModel):
    energy: str
    water: str
    carbon: str


class AnalyzeResponse(BaseModel):
    optimizedPrompt: str
    taskType: str
    complexity: str
    aiNecessity: str
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
# Core Prompt Analyzer Helper
# ---------------------------------------------------------------------------

async def query_ollama_analyzer(prompt: str) -> dict:
    prompt_template = (
        "You are GreenMind's Prompt Analyzer. Analyze the user prompt and classify it into structured categories.\n"
        "You MUST respond ONLY with a single valid raw JSON object matching this exact schema:\n"
        "{\n"
        '  "taskType": "coding" | "writing" | "research" | "summarization" | "brainstorming" | "education" | "other",\n'
        '  "complexity": "low" | "medium" | "high",\n'
        '  "aiNecessity": "low" | "medium" | "high",\n'
        '  "reasoning": "A concise 1-2 sentence explanation of why the prompt was classified this way."\n'
        "}\n\n"
        f"User Prompt: {prompt}"
    )

    try:
        raw_text = await query_llm(prompt_template)
        return json.loads(raw_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse valid JSON output from LLM provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM provider error: {str(e)}")


# ---------------------------------------------------------------------------
# Integrated /analyze Endpoint
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_prompt_endpoint(request: AnalyzeRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    prompt = request.prompt
    history = request.history or []

    # 1. Execute LLM-based tasks concurrently using asyncio.gather for speed
    try:
        analysis_task = query_ollama_analyzer(prompt)
        optimizer_task = query_ollama_optimizer(prompt)
        slop_task = run_slop_detection(prompt, history)

        analysis_res, optimizer_res, slop_res = await asyncio.gather(
            analysis_task, optimizer_task, slop_task
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

    # 2. Extract analysis outputs & reconcile aiNecessity
    task_type = analysis_res.get("taskType", "other")
    complexity = analysis_res.get("complexity", "medium")
    raw_ai_necessity = analysis_res.get("aiNecessity", "medium")
    optimized_prompt = optimizer_res.get("optimizedPrompt", prompt)

    rule_necessity, _ = detect_ai_necessity(prompt)
    if rule_necessity == "high" and raw_ai_necessity == "low":
        ai_necessity = "medium" if complexity == "low" else "high"
    else:
        ai_necessity = raw_ai_necessity


    # 3. Calculate token metrics
    token_stats = calculate_token_savings(prompt, optimized_prompt)

    # 4. Generate model recommendation
    rec_tier = select_tier(task_type, complexity, ai_necessity)
    rec_entry = _TIER_BY_NAME.get(rec_tier, _TIER_BY_NAME["small"])
    rec_reason = build_reason(rec_entry, task_type, complexity, ai_necessity)

    # 5. Calculate Green Score (0-100)
    score_req = ScoreRequest(
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
        suggestion=slop_res["suggestion"]
    )

    impact_detail = ImpactDetail(
        energy=impact_stats["energy"],
        water=impact_stats["water"],
        carbon=impact_stats["carbon"]
    )

    return AnalyzeResponse(
        optimizedPrompt=optimized_prompt,
        taskType=task_type,
        complexity=complexity,
        aiNecessity=ai_necessity,
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