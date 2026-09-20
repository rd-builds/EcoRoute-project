import asyncio
from optimizer import optimize_prompt_intelligently, query_ollama_optimizer
from token_counter import calculate_token_savings
from analyzer import analyze_prompt_endpoint, AnalyzeRequest

async def run_tests():
    test_cases = [
        ("1. Very Short Vague Prompt", "Tell me about climate change.", "education"),
        ("2. Medium Prompt", "Can you please write a professional email to my manager explaining that I need to take off this Friday due to a doctor appointment and also let them know I will finish the report by Thursday. Thank you!", "writing"),
        ("3. Very Long Repetitive Prompt", "Could you please help me write a Python script for web scraping? Please make sure the code is very clean and professional. I want you to scrape product prices from an ecommerce website. Please ensure you use Python. The code must be well documented and professional. Also please make sure you handle errors properly and include comments. Please write it in Python. Ensure proper error handling. Also make sure the tone is professional. Please provide the complete Python script with error handling and comments.", "coding"),
        ("4. Long Well-Structured Prompt", """### Task: Implement a Rate Limiter in Python

#### Requirements:
- Implement a token bucket algorithm using Redis for distributed state.
- Support configurable rate limits: `max_requests` (int) and `window_seconds` (int).
- Return a boolean `is_allowed(user_id: str)` indicating if the request can proceed.
- Include type annotations and docstrings.

#### Output Format:
- Provide the complete Python class `RedisTokenBucket`.
- Include a brief unit test using `unittest.mock`.""", "coding")
    ]

    print("================================================================================")
    print("RUNNING PIPELINE TESTS FOR ECOROUTE PROMPT OPTIMIZER")
    print("================================================================================")

    for name, prompt_text, task in test_cases:
        req = AnalyzeRequest(prompt=prompt_text, task=task)
        res = await analyze_prompt_endpoint(req)
        
        print(f"\n>>> TEST CASE: {name}")
        print(f"Original Tokens: {res.tokensBefore}")
        print(f"Optimized Tokens: {res.tokensAfter}")
        print(f"Token Reduction: {res.tokenReduction} ({res.tokenReductionPercentage}%)")
        print(f"Optimization Reasoning: {res.reasoning}")
        print(f"Changes: {res.changes}")
        print("-" * 50)
        print("ORIGINAL PROMPT:")
        print(prompt_text)
        print("-" * 50)
        print("OPTIMIZED PROMPT:")
        print(res.optimizedPrompt)
        print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_tests())
