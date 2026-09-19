"""
token_counter.py — GreenMind Token Calculator
----------------------------------------------
Calculates token counts programmatically using tiktoken (OpenAI's BPE tokenizer).

Tokenizer choice: cl100k_base
- Used by GPT-3.5 and GPT-4; a widely accepted approximation for modern LLMs.
- Real BPE tokenization — not a character or word heuristic.
- No model download required; fast and lightweight.
- For English prompts, produces counts within a few percent of Qwen's own tokenizer.

Token counting is done entirely in Python — the LLM is never asked to estimate.
"""

import tiktoken
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Load once at import time — tiktoken caches the encoding after the first load
_ENCODING = tiktoken.get_encoding("cl100k_base")


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class TokenCountRequest(BaseModel):
    originalPrompt: str
    optimizedPrompt: str


class TokenCountResponse(BaseModel):
    tokensBefore: int
    tokensAfter: int
    tokenReduction: int
    tokenReductionPercentage: float


# ---------------------------------------------------------------------------
# Core utility — importable by other modules (e.g. optimizer pipeline)
# ---------------------------------------------------------------------------

def count_tokens(text: str) -> int:
    """Return the number of BPE tokens in a text string."""
    return len(_ENCODING.encode(text))


def calculate_token_savings(original: str, optimized: str) -> dict:
    """
    Compare token counts between two prompt strings.
    Returns a dict with tokensBefore, tokensAfter, tokenReduction,
    and tokenReductionPercentage (rounded to 2 decimal places).
    A negative tokenReduction means the optimized prompt is longer.
    """
    before = count_tokens(original)
    after  = count_tokens(optimized)
    reduction = before - after
    percentage = round((reduction / before) * 100, 2) if before > 0 else 0.0

    return {
        "tokensBefore":             before,
        "tokensAfter":              after,
        "tokenReduction":           reduction,
        "tokenReductionPercentage": percentage,
    }


# ---------------------------------------------------------------------------
# FastAPI endpoint
# ---------------------------------------------------------------------------

# Synchronous — pure CPU computation, no I/O, no await needed
@router.post("/token-count", response_model=TokenCountResponse)
def token_count_endpoint(request: TokenCountRequest):
    result = calculate_token_savings(request.originalPrompt, request.optimizedPrompt)
    return TokenCountResponse(**result)
