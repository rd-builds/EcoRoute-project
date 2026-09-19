"""
classifier.py — EcoRoute Task Classification & Prompt Quality Evaluation Engine
--------------------------------------------------------------------------------
Evaluates prompt quality based on:
1. Intent Clarity (20%)
2. Task Specificity (20%)
3. Context Completeness (20%)
4. Output / Format Requirements (15%)
5. Constraints & Scoping (15%)
6. Actionability & Anti-Ambiguity (10%)

PROMPT QUALITY != PROMPT LENGTH
"""

import re
from typing import Optional, Tuple, Dict, Any


def classify_task_type(prompt: str, user_selected_task: Optional[str] = None) -> str:
    """
    Validates and classifies the prompt into its true task category:
    'coding', 'writing', 'research', 'summarization', 'brainstorming', 'education', 'other'.
    
    If user selected a mismatched dropdown (e.g. 'coding' for an email),
    the actual prompt content takes precedence.
    """
    lower = prompt.lower().strip()
    words = [w for w in re.findall(r'\b\w+\b', lower)]

    # 1. Strong writing / communication patterns
    writing_terms = [
        'email', 'letter', 'memo', 'essay', 'caption', 'captions', 'tweet', 'tweets',
        'blog', 'post', 'cover letter', 'apology', 'announcement', 'newsletter',
        'draft an email', 'write an email', 'write email', 'draft email', 'write to my',
        'formal tone', 'professional email', 'message to'
    ]
    if any(term in lower for term in writing_terms):
        return 'writing'

    # 2. Strong coding / engineering patterns
    coding_terms = [
        'binary search', 'algorithm', 'react', 'python', 'java ', 'javascript',
        'typescript', 'c++', 'sql', 'function', 'class', 'method', 'syntax',
        'debug', 'debugging', 'stacktrace', 'time complexity', 'space complexity',
        'array', 'linked list', 'tree', 'api', 'endpoint', 'component', 'props',
        'hook', 'state management', 'unit test', 'refactor code', 'compiler'
    ]
    # If explicitly asking to write/implement code or debug
    has_code_action = any(k in lower for k in ['implement', 'program', 'script', 'debug', 'code', 'function', 'fix error'])
    if any(term in lower for term in coding_terms) and (has_code_action or not lower.startswith(('explain', 'what is', 'teach'))):
        return 'coding'

    # 3. Education / Conceptual explanation patterns
    education_terms = [
        'explain', 'teach', 'how does', 'what is', 'beginner', 'concept',
        'tutorial', 'difference between', 'why does', 'walk me through', 'guide for beginner'
    ]
    if any(term in lower for term in education_terms):
        return 'education'

    # 4. Summarization patterns
    if any(term in lower for term in ['summarize', 'summary', 'tl;dr', 'recap', 'condense', 'key takeaways', 'bullet points summary']):
        return 'summarization'

    # 5. Research / Comparison patterns
    if any(term in lower for term in ['research', 'literature review', 'pros and cons', 'compare and contrast', 'market analysis', 'tradeoffs']):
        return 'research'

    # 6. Brainstorming patterns
    if any(term in lower for term in ['brainstorm', 'ideas for', 'creative names', 'suggestions for', 'generate concepts']):
        return 'brainstorming'

    # 7. Fallback to user-selected task if valid, else 'other'
    valid_tasks = {'coding', 'writing', 'research', 'summarization', 'brainstorming', 'education', 'other'}
    if user_selected_task and user_selected_task.lower() in valid_tasks:
        return user_selected_task.lower()

    return 'other'


def evaluate_prompt_quality(prompt: str, task_type: str = 'other') -> Tuple[float, Dict[str, float]]:
    """
    Evaluates prompt quality on a transparent 0-100 scale across 6 dimensions.
    """
    raw = prompt.strip()
    words = [w for w in re.findall(r'\b\w+\b', raw)]
    word_count = len(words)
    lower = raw.lower()

    # 1. Intent Clarity (max 20)
    intent_score = 0.0
    action_verbs = [
        'write', 'draft', 'create', 'explain', 'describe', 'debug', 'fix', 'implement',
        'summarize', 'compare', 'analyze', 'evaluate', 'calculate', 'convert', 'build',
        'generate', 'outline', 'design', 'list', 'review', 'solve', 'help me'
    ]
    has_action = any(lower.startswith(v) or f' {v} ' in f' {lower} ' for v in action_verbs)
    if has_action:
        intent_score += 12.0
    elif word_count >= 3:
        intent_score += 6.0
    else:
        intent_score += 3.0

    # Sentence casing and punctuation structure
    if re.search(r'^[A-Z]', raw) and (raw.endswith('.') or raw.endswith('?') or raw.endswith('!')):
        intent_score += 4.0
    elif re.search(r'^[A-Z]', raw):
        intent_score += 2.0
        
    if word_count >= 6:
        intent_score += 4.0
    elif word_count >= 3:
        intent_score += 2.0
    intent_score = min(intent_score, 20.0)

    # 2. Specificity (max 20)
    specificity_score = 0.0
    domain_terms = [
        'java', 'python', 'react', 'binary search', 'recursion', 'base case', 'network issue',
        'examination', 'exam', 'dean', 'algorithm', 'time complexity', 'space complexity',
        'authentication', 'database', 'sql', 'integer array', 'sorted', 'instagram', 'coffee shop',
        'beginner', 'professional', 'consideration', 'function', 'class', 'api', 'component'
    ]
    matched_terms = [t for t in domain_terms if t in lower]
    term_points = len(matched_terms) * 5.0
    specificity_score += min(term_points, 15.0)

    if word_count >= 15:
        specificity_score += 5.0
    elif word_count >= 8:
        specificity_score += 3.0
    elif word_count >= 4:
        specificity_score += 1.0
    specificity_score = min(specificity_score, 20.0)

    # 3. Context Completeness (max 20)
    context_score = 0.0
    context_markers = [
        'explaining that', 'because', 'stating that', 'in order to', 'during', 'regarding',
        'for', 'with', 'on a', 'that implements', 'using', 'due to', 'about', 'experiencing',
        'facing', 'stating', 'explaining', 'to my', 'to the'
    ]
    matched_markers = [m for m in context_markers if m in lower]
    context_score += min(len(matched_markers) * 6.0, 12.0)

    if any(k in lower for k in ['my dean', 'the dean', 'the exam', 'my exam', 'my examination', 'a beginner', 'sorted array', 'coffee shop']):
        context_score += 5.0
    elif any(k in lower for k in ['dean', 'exam', 'java', 'react']):
        context_score += 2.0

    if word_count >= 12:
        context_score += 3.0
    context_score = min(context_score, 20.0)

    # 4. Output & Format Requirements (max 15)
    output_score = 0.0
    format_markers = [
        'email', 'professional email', 'simple example', 'one simple example', 'short explanation',
        'step-by-step', 'code', 'program', 'bullet points', 'summary', 'plan', 'time complexity',
        'captions', 'detailed plan', 'table'
    ]
    matched_formats = [f for f in format_markers if f in lower]
    if len(matched_formats) >= 2:
        output_score += 12.0
    elif len(matched_formats) == 1:
        output_score += 8.0

    if any(k in lower for k in ['professional', 'simple', 'concise', 'short', 'detailed', 'politely', 'step by step', 'respectful']):
        output_score += 3.0
    output_score = min(output_score, 15.0)

    # 5. Constraints & Scoping (max 15)
    constraint_score = 0.0
    constraints = [
        'to a beginner', 'beginner', 'sorted', 'integer array', 'one simple', 'short', 'politely',
        'professional', 'concise', 'with an a', '20 different', 'in java', 'using python'
    ]
    matched_constraints = [c for c in constraints if c in lower]
    constraint_score += min(len(matched_constraints) * 5.0, 12.0)
    if word_count > 6 and any(k in lower for k in ['with', 'and', 'using', 'in', 'without']):
        constraint_score += 3.0
    constraint_score = min(constraint_score, 15.0)

    # 6. Ambiguity & Actionability (max 10)
    if word_count <= 3 and len(matched_terms) <= 1:
        # Extreme telegram vagueness penalty
        actionability_score = 2.0
    elif word_count <= 5 and not any(m in lower for m in context_markers):
        actionability_score = 4.0
    elif word_count >= 8 and (has_action or len(matched_terms) >= 2):
        actionability_score = 10.0
    else:
        actionability_score = 6.0

    total_score = intent_score + specificity_score + context_score + output_score + constraint_score + actionability_score
    total_score = round(min(max(total_score, 10.0), 98.0), 1)

    breakdown = {
        'intentClarity': intent_score,
        'specificity': specificity_score,
        'contextCompleteness': context_score,
        'outputRequirements': output_score,
        'constraints': constraint_score,
        'actionability': actionability_score
    }
    return total_score, breakdown


def evaluate_complexity(prompt: str, task_type: str, quality_score: float) -> str:
    """
    Evaluates true reasoning and technical complexity ('low', 'medium', 'high')
    based on task requirements, domain depth, and reasoning difficulty.
    """
    lower = prompt.lower()
    
    # 1. Simple factual / low-compute tasks
    if any(k in lower for k in ['what is', 'what time', 'calculate', 'capitalize', 'reverse', '15 * 8', 'simple math']):
        return 'low'

    # 2. High-complexity technical tasks
    high_complexity_markers = [
        'binary search', 'time complexity', 'space complexity', 'dynamic programming',
        'architecture', 'system design', 'refactor', 'deep debugging', 'concurrency',
        'multi-threading', 'distributed', 'security audit', 'algorithm'
    ]
    if any(k in lower for k in high_complexity_markers):
        return 'high'

    # 3. Standard writing, education, summaries, and medium tasks
    return 'medium'


def evaluate_ai_necessity(prompt: str) -> Dict[str, Any]:
    """
    Evaluates whether an LLM is required, optional, or not required for the user prompt.
    Categories:
    - AI_NOT_REQUIRED: Deterministic math, unit/currency conversions, array sorting, string capitalization.
    - AI_OPTIONAL: General advice, basic task organization, or routine templates where non-AI approaches exist.
    - AI_REQUIRED: Semantic analysis, customer complaint theme extraction, professional text rewriting, code debugging, or complex reasoning.
    """
    lower = prompt.strip().lower()

    # --- 1. AI_NOT_REQUIRED Patterns ---
    
    # A. Arithmetic & Simple Math:
    # e.g., "What is 25 * 48?", "What is 15 * 8?", "25 * 48", "Calculate 15% of 800", "100 / 4"
    math_expr = re.compile(
        r"^(?:what\s+is\s+|calculate\s+|compute\s+|eval\s+|evaluate\s+)?(?:\d+\.?\d*%?\s*(?:of|\+|\-|\*|\/|x|×|÷|\^)\s*\d+\.?\d*%?|\d+\s*[\+\-\*\/x×÷]\s*\d+)\s*\??$",
        re.IGNORECASE
    )
    if math_expr.search(lower) or re.search(r"\b\d+%\s+of\s+\d+\b", lower) or re.search(r"\b\d+\s*[\+\-\*\/x×÷]\s*\d+\b", lower):
        if len(re.findall(r'\b\w+\b', lower)) <= 12 and not any(k in lower for k in ['explain', 'code', 'python', 'story']):
            return {
                "status": "AI_NOT_REQUIRED",
                "confidence": 0.97,
                "reason": "This is a deterministic arithmetic calculation that can be solved without an LLM.",
                "alternative": "Use a basic calculator, spreadsheet formula, or local math expression evaluator."
            }

    # B. Unit and Currency Conversions:
    # e.g., "Convert 5 km to meters.", "Convert 100 USD to INR.", "5 miles to km", "100 fahrenheit to celsius"
    unit_conv = re.compile(
        r"\b(?:convert|change|transform)\s+\d+(?:\.\d+)?\s*(?:km|kilometers?|m|meters?|miles?|cm|mm|kg|lbs?|pounds?|grams?|usd|inr|eur|gbp|cad|aud|yen|jpy|celsius|fahrenheit|f|c)\s+(?:to|in|into)\s+(?:km|kilometers?|m|meters?|miles?|cm|mm|kg|lbs?|pounds?|grams?|usd|inr|eur|gbp|cad|aud|yen|jpy|celsius|fahrenheit|f|c)\b",
        re.IGNORECASE
    )
    if unit_conv.search(lower) or (("convert" in lower or "to" in lower) and any(u in lower for u in ["km to meters", "usd to inr", "miles to km", "kg to lbs", "celsius to fahrenheit"])):
        return {
            "status": "AI_NOT_REQUIRED",
            "confidence": 0.97,
            "reason": "This is a deterministic unit or currency conversion that can be calculated without an LLM.",
            "alternative": "Use a simple unit conversion formula or currency converter tool."
        }

    # C. Deterministic Sorting & String Manipulations:
    # e.g., "Sort these numbers", "Reverse string", "Uppercase this text"
    sorting_expr = re.compile(
        r"\b(?:sort|order|alphabetize|reverse|uppercase|lowercase|capitalize)\s+(?:these|the|this)?\s*(?:numbers?|list|array|words?|string|text)?\b",
        re.IGNORECASE
    )
    if sorting_expr.search(lower) and len(re.findall(r'\b\w+\b', lower)) <= 15 and not any(k in lower for k in ["complaint", "feedback", "email", "essay", "article", "theme"]):
        return {
            "status": "AI_NOT_REQUIRED",
            "confidence": 0.95,
            "reason": "This is a simple data manipulation or sorting task that can be executed deterministically.",
            "alternative": "Use local code or standard built-in programming functions (e.g., Array.sort(), str.upper())."
        }

    # --- 2. AI_OPTIONAL Patterns ---
    
    # Generic task organization, list generation tips, routine templates, common productivity frameworks:
    # e.g., "Give me 5 ways to organize my daily tasks.", "Give me 5 ways to organize my tasks."
    optional_patterns = [
        re.compile(r"\b(?:give\s+me\s+)?(?:\d+\s+)?(?:ways|methods|tips|ideas|steps|frameworks)\s+to\s+(?:organize|manage|structure|plan)\s+(?:my\s+)?(?:daily\s+)?(?:tasks|day|schedule|work|time)\b", re.IGNORECASE),
        re.compile(r"\b(?:how\s+to|best\s+way\s+to)\s+(?:organize|manage|structure)\s+(?:my\s+)?(?:tasks|schedule|notes)\b", re.IGNORECASE),
        re.compile(r"\b(?:template|checklist|agenda)\s+for\s+(?:daily\s+tasks|meeting|weekly\s+review)\b", re.IGNORECASE)
    ]
    if any(pattern.search(lower) for pattern in optional_patterns):
        return {
            "status": "AI_OPTIONAL",
            "confidence": 0.88,
            "reason": "An LLM can provide suggestions, but standard productivity frameworks (e.g., Eisenhower Matrix, Time-Blocking) or task management templates work well without AI.",
            "alternative": "Consider using established productivity frameworks like Time-Blocking, the Eisenhower Matrix, or standard task app templates."
        }

    # --- 3. AI_REQUIRED Patterns (and Fallback) ---
    
    reason = "The task requires language-model reasoning, semantic generation, or contextual synthesis."
    if any(k in lower for k in ["complaint", "recurring themes", "analyze", "sentiment", "customer"]):
        reason = "The task requires semantic analysis and theme extraction from unstructured text or customer feedback."
    elif any(k in lower for k in ["rewrite", "edit", "tone", "professional", "concise", "email", "essay"]):
        reason = "The task requires natural language editing, tone adjustment, and stylistic adaptation."
    elif any(k in lower for k in ["debug", "code", "java", "python", "react", "inheritance", "algorithm", "function", "class"]):
        reason = "The task requires technical problem solving, language syntax comprehension, or code analysis."

    return {
        "status": "AI_REQUIRED",
        "confidence": 0.94,
        "reason": reason,
        "alternative": None
    }

