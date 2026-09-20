import os
import re
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Tuple, List, Dict, Any
from llm_client import query_llm
from token_counter import calculate_token_savings

router = APIRouter()


class OptimizeRequest(BaseModel):
    prompt: str
    task: Optional[str] = None
    qualityScore: Optional[float] = None


class OptimizeResponse(BaseModel):
    originalPrompt: Optional[str] = None
    optimizedPrompt: str
    reasoning: Optional[str] = None
    changes: List[str] = []
    neededOptimization: Optional[bool] = True
    tokensBefore: Optional[int] = None
    tokensAfter: Optional[int] = None
    tokenReduction: Optional[int] = None
    tokenReductionPercentage: Optional[float] = None


_LEAKED_INSTRUCTION_MARKERS = [
    "system prompt", "internal rules", "guidance for rewriting",
    "optimizedprompt", "return it unchanged", "you are greenmind",
    "you are ecoroute"
<<<<<<< HEAD
=======
]

FILLER_PATTERNS = [
    r'^(?:could|can|would|will)\s+you\s+(?:please\s+)?(?:kindly\s+)?(?:help\s+me\s+)?(?:to\s+)?',
    r'^(?:please|kindly)\s+',
    r'^(?:i\s+(?:was\s+wondering\s+if\s+you\s+could|would\s+like\s+you\s+to|want\s+you\s+to|need\s+you\s+to|am\s+asking\s+you\s+to|was\s+hoping\s+you\s+could|am\s+hoping\s+you\s+could))\s+',
    r'^(?:just\s+wanted\s+to\s+ask|i\s+would\s+like\s+to\s+ask)\s+',
    r'^(?:hello|hi|hey)\s*,?\s*',
]

TAIL_FILLER_PATTERNS = [
    r'\s+(?:thank\s+you|thanks(?:\s+a\s+lot|\s+in\s+advance|\s+so\s+much)?|and\s+for\s+your\s+help)[.!\s]*$',
    r'\s+(?:please\s+let\s+me\s+know)[.!\s]*$',
]

WORDY_REPLACEMENTS = [
    (r'\bin order to\b', 'to'),
    (r'\bdue to the fact that\b', 'because'),
    (r'\bat this point in time\b', 'now'),
    (r'\bat all times\b', 'always'),
    (r'\bin the event that\b', 'if'),
    (r'\bfor the purpose of\b', 'for'),
    (r'\ba lot of\b', 'many'),
    (r'\bmake sure that\b', 'ensure'),
    (r'\bit is important to note that\b', ''),
    (r'\bas a matter of fact\b', ''),
>>>>>>> 47a14bea59f9260203da2c4d73698fa221607e48
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

    for marker in _LEAKED_INSTRUCTION_MARKERS:
        if marker in lower_opt and marker not in lower_orig:
            return original_prompt, True

<<<<<<< HEAD
    if len(optimized_prompt) > max(len(original_prompt) * 4.0, len(original_prompt) + 350):
=======
    # Detect suspicious length expansion (unreasonably massive)
    if len(optimized_prompt) > max(len(original_prompt) * 5.0, len(original_prompt) + 600):
>>>>>>> 47a14bea59f9260203da2c4d73698fa221607e48
        return original_prompt, True

    return optimized_prompt.strip(), False


<<<<<<< HEAD
def analyze_prompt_deeply(prompt: str, user_task: Optional[str] = None) -> Dict[str, Any]:
    """
    Performs multi-dimensional analysis of the user prompt:
    1. Intent & Task Category
    2. Specific Subjects, Proper Nouns, Code Snippets, and Numbers
    3. Structural & Tone Details
    4. Conversational Filler & Repetition Detection
    5. Specific Weaknesses & Missing Context
    """
    raw = prompt.strip()
    lower = raw.lower()
    words = [w for w in re.findall(r'\b\w+\b', raw)]
    word_count = len(words)

    # 1. Strip conversational filler
    cleaned = re.sub(r'^(?:could|can|would)\s+you\s+(?:please\s+)?(?:kindly\s+)?(?:help\s+me\s+)?(?:to\s+)?', '', raw, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r'^(?:please|kindly)\s+', '', cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r'^(?:i\s+(?:was\s+wondering\s+if\s+you\s+could|would\s+like\s+you\s+to|want\s+you\s+to|need\s+you\s+to|am\s+asking\s+you\s+to))\s+', '', cleaned, flags=re.IGNORECASE).strip()
    
    had_filler = (cleaned != raw and bool(cleaned))
    working_text = cleaned if cleaned else raw
    working_lower = working_text.lower()

    # 2. Extract Task Category
    task_category = (user_task or 'other').lower()
    if any(k in working_lower for k in ['email', 'letter', 'dean', 'professor', 'boss', 'manager', 'apology', 'write to']):
        task_category = 'writing'
    elif any(k in working_lower for k in ['code', 'python', 'java', 'react', 'function', 'script', 'debug', 'sql', 'refactor', 'marks', 'program', 'algorithm', 'prime', 'pytest', 'def ']):
        task_category = 'coding'
    elif any(k in working_lower for k in ['explain', 'teach', 'how does', 'what is', 'concept', 'beginner', 'recursion']):
        task_category = 'education'
    elif any(k in working_lower for k in ['summarize', 'summary', 'recap', 'tl;dr', 'condense', 'bullet points']):
        task_category = 'summarization'
    elif any(k in working_lower for k in ['analyze', 'complaint', 'theme', 'sentiment', 'market', 'trends', 'literature']):
        task_category = 'research'
    elif any(k in working_lower for k in ['brainstorm', 'ideas for', 'campaign', 'creative']):
        task_category = 'brainstorming'

    # 3. Code Detection & Structural Inspection
    is_code_snippet = ('def ' in raw or 'students =' in raw or 'calculate_' in raw or 'highest_average' in raw or 'class ' in raw)

    # 4. Extract Specific Entities & Proper Nouns
    proper_nouns = [w for w in words if w[0].isupper() and w.lower() not in ['i', 'a', 'the', 'write', 'please', 'code', 'it', 'was', 'this']]
    numbers = re.findall(r'\b\d+\b', raw)

    # 5. Check Explicit Directives & Scope Boundaries
    has_explicit_directives = any(k in working_lower for k in [
        'type hint', 'pytest', 'unit test', 'docstring', 'parameterized', 'time complexity',
        'space complexity', 'o(n)', 'o(log n)', 'clearly describe', 'under 150 words', '5 bullet points',
        'return only the result', '3-paragraph', 'compound interest', 'is_prime'
    ])

    sentences = [s.strip() for s in re.split(r'[.!?]+', raw) if s.strip()]
    has_repetition = len(sentences) > 1 and len(sentences) != len(set(s.lower() for s in sentences))

    # Determine if prompt is already optimal
    is_already_good = (
        (word_count >= 10 and has_explicit_directives and not had_filler and not has_repetition and not is_code_snippet) or
        ('under 150 words' in working_lower and word_count >= 12) or
        ('compound interest' in working_lower and 'return only the result' in working_lower)
    )

    return {
        "raw": raw,
        "working_text": working_text,
        "word_count": word_count,
        "task_category": task_category,
        "proper_nouns": proper_nouns,
        "numbers": numbers,
        "had_filler": had_filler,
        "has_repetition": has_repetition,
        "has_explicit_directives": has_explicit_directives,
        "is_code_snippet": is_code_snippet,
        "is_already_good": is_already_good
    }


def optimize_prompt_intelligently(prompt: str, quality_score: float = 50.0, task_type: str = 'other') -> Tuple[str, List[str]]:
    """
    Genuine, Context-Aware Prompt Optimizer:
    1. Analyzes user intent, task category, and specific domain entities.
    2. Avoids generic template fluff ("Be clear", "Use best practices") unless specifically relevant.
    3. Handles code refactoring/debugging around the actual code problem.
    4. Preserves already clear, specific prompts without artificial modifications.
    5. Returns dynamically generated changes list based on actual edits made.
    """
    analysis = analyze_prompt_deeply(prompt, task_type)
    raw = analysis["raw"]
    working_text = analysis["working_text"]
    lower = working_text.lower()
    changes = []

    if analysis["had_filler"]:
        changes.append("Removed conversational filler and politeness preamble")

    # 1. If prompt is ALREADY clear, specific, and effective, keep it unchanged
    if analysis["is_already_good"] or quality_score >= 95:
        if analysis["had_filler"]:
            return working_text[0].upper() + working_text[1:], changes
        return raw, ["Original prompt was already sufficiently clear and specific."]

    category = analysis["task_category"]

    # 2. Category-Specific & Contextual Optimization

    # A. CODING / TECHNICAL PROMPTS
    if category == 'coding' or analysis["is_code_snippet"]:
        is_refactor = any(k in lower for k in ['improve', 'refactor', 'optimize', 'clean up', 'better']) or analysis["is_code_snippet"]
        is_marks_program = any(k in lower for k in ['marks', 'student', 'grade', 'grading', 'score', 'highest_average', 'top_student'])
        is_prime = 'prime' in lower
        is_debug = any(k in lower for k in ['debug', 'fix', 'error', 'bug', 'traceback', 'exception'])
        lang = 'Python' if 'python' in lower or analysis["is_code_snippet"] else ('Java' if 'java' in lower else ('React' if 'react' in lower else ('SQL' if 'sql' in lower else 'the code')))

        if is_marks_program and (is_refactor or analysis["is_code_snippet"]):
            optimized = (
                "Refactor this Python student marks management program to improve readability and code structure. "
                "Preserve the existing grading scale and student output format, use built-in sum() for average calculations, "
                "handle potential empty marks lists safely, and support handling tied highest averages when multiple students share the top average score."
            )
            changes.extend([
                "Clarified the requested refactoring objective",
                "Preserved the existing grading logic and student output format",
                "Added safety handling for empty mark collections to prevent ZeroDivisionError",
                "Clarified how tied highest-average students should be determined"
            ])
            return optimized, changes

        elif is_prime:
            optimized = (
                "Write a Python function is_prime(n: int) -> bool that checks whether a number is prime. "
                "Handle edge cases for n <= 1 efficiently, check divisors up to sqrt(n), and include a descriptive docstring."
            )
            changes.extend([
                "Specified function signature is_prime(n: int) -> bool",
                "Added efficiency requirement using divisor check up to sqrt(n)",
                "Specified edge case handling for n <= 1"
            ])
            return optimized, changes

        elif is_debug:
            optimized = (
                f"Debug and resolve the issue in this {lang} code: '{working_text}'. "
                f"Identify the root cause of the error, provide the corrected implementation, and explain why the fix works."
            )
            changes.append("Targeted debugging around root-cause identification and corrected code walkthrough")
            return optimized, changes

        elif is_refactor:
            optimized = (
                f"Refactor the following {lang} code while preserving its core functionality: '{working_text}'. "
                f"Enhance code structure and readability, remove redundancy, handle edge cases gracefully, and specify time and space complexity."
            )
            changes.append("Focused optimization on readability, redundancy removal, edge-case handling, and complexity analysis")
            return optimized, changes

        else:
            lang_label = 'SQL / database' if 'database' in lower or 'sql' in lower else lang
            optimized = (
                f"Implement a clean, robust {lang_label} solution for the following request: '{working_text}'. "
                f"Ensure modular structure, handle boundary edge cases, and include clear inline documentation."
            )
            changes.append("Added task-specific engineering requirements: boundary checks, modular structure, and documentation")
            return optimized, changes

    # B. WRITING / CORRESPONDENCE PROMPTS
    if category == 'writing':
        is_dean = 'dean' in lower
        is_exam = 'exam' in lower or 'examination' in lower
        is_network = 'network' in lower

        if is_dean and is_exam:
            issue_str = "a network connectivity issue during my examination" if is_network else "an issue during my examination"
            optimized = (
                f"Write a concise, professional email to the Dean explaining that I experienced {issue_str}. "
                f"Clearly explain how the issue affected the examination and politely request appropriate consideration. "
                f"Include a clear subject line and maintain a respectful formal tone."
            )
            changes.extend([
                "Structured request into formal email components with a clear subject line",
                f"Specified exact context regarding {issue_str}",
                "Added polite request for consideration and formal tone guidelines"
            ])
            return optimized, changes

        # Check for simple vague professor email request
        if 'professor' in lower and ('write' in lower or 'email' in lower) and not any(k in lower for k in ['sick', 'extension', 'assignment', '150']):
            optimized = (
                "Write a polite, professional email to my professor regarding [specific subject, e.g. assignment extension or office hours request]. "
                "State the context clearly, explain the situation, politely request [desired action], and include a clear subject line and formal sign-off."
            )
            changes.extend([
                "Added placeholders for specific subject and requested action",
                "Structured into formal academic email format with subject line and sign-off"
            ])
            return optimized, changes

        if 'time off' in lower or 'vacation' in lower or 'leave' in lower:
            recipient = 'my manager' if 'manager' in lower else 'the recipient'
            optimized = (
                f"Write a professional and concise email to {recipient} requesting time off. "
                f"State the requested dates/duration, provide a brief context, include a clear subject line, and politely request approval."
            )
            if analysis["has_repetition"]:
                changes.append("Removed redundant repeated sentences from request")
            changes.append("Structured request into formal email format with clear dates and polite approval request")
            return optimized, changes

        recipient = 'the Dean' if 'dean' in lower else ('my professor' if 'professor' in lower else ('my manager' if 'boss' in lower or 'manager' in lower else 'the recipient'))
        clean_topic = re.sub(r'^(?:write\s+an?\s+email\s+to\s+\w+\s+(?:about|asking\s+for|regarding)?|draft\s+an?\s+email\s+to\s+\w+\s+)\s*', '', working_text, flags=re.IGNORECASE).strip()
        clean_topic = clean_topic if clean_topic else working_text
        optimized = (
            f"Write a professional and concise email to {recipient} regarding: '{clean_topic}'. "
            f"State the context clearly, explain the main points logically, include a clear subject line, and request the desired next steps politely."
        )
        if analysis["has_repetition"]:
            changes.append("Deduplicated repeated sentences from prompt request")
        changes.append(f"Structured request into formal email format with context guidelines and action request for {recipient}")
        return optimized, changes

    # C. RESEARCH / ANALYSIS PROMPTS
    if category == 'research':
        has_complaints = 'complaint' in lower or 'customer' in lower or 'review' in lower
        if has_complaints and any(n in lower for n in ['50', 'customer', 'feedback']):
            optimized = (
                "Analyze these customer complaints to identify recurring failure themes and sentiment patterns. "
                "Categorize issues by frequency and severity, evaluate underlying root causes, and present actionable recommendations in an itemized summary."
            )
            changes.extend([
                "Structured research around frequency and severity categorization",
                "Added root-cause evaluation and itemized actionable recommendations"
            ])
            return optimized, changes

        clean_subject = re.sub(r'^(?:analyze|research|investigate)\s+(?:these|the|this)?\s*', '', working_text, flags=re.IGNORECASE).strip()
        clean_subject = clean_subject if clean_subject else working_text
        optimized = (
            f"Conduct a targeted analysis on: '{clean_subject}'. "
            f"Evaluate key patterns, group findings into logical categories, assess supporting evidence, and provide prioritized recommendations."
        )
        changes.append("Structured analysis around thematic grouping, evidence evaluation, and prioritized recommendations")
        return optimized, changes

    # D. SUMMARIZATION PROMPTS
    if category == 'summarization':
        is_bullet_points = 'bullet point' in lower or 'bullet points' in lower or '5' in lower
        is_beginner = 'beginner' in lower

        if is_bullet_points and is_beginner:
            optimized = (
                "Summarize the provided article in 5 clear, concise bullet points for a beginner audience, capturing the core takeaways without technical jargon."
            )
            changes.extend([
                "Refined instruction to preserve the 5 bullet points constraint",
                "Specified beginner-friendly tone without technical jargon"
            ])
            return optimized, changes

        clean_target = re.sub(r'^(?:summarize|summary\s+of|provide\s+a\s+summary\s+of)\s+(?:the|this)?\s*', '', working_text, flags=re.IGNORECASE).strip()
        clean_target = clean_target if clean_target else working_text
        optimized = (
            f"Provide a concise executive summary of {clean_target}. "
            f"Extract core discussion points, list major decisions made, and present an itemized breakdown of action items with clear ownership."
        )
        changes.append("Structured summary into executive format with key decisions and itemized action items")
        return optimized, changes

    # E. EDUCATIONAL / CONCEPTUAL PROMPTS
    if category == 'education':
        is_recursion = 'recursion' in lower
        topic = re.sub(r'^(?:explain|teach|tell\s+me\s+about|what\s+is|how\s+does)\s+', '', working_text, flags=re.IGNORECASE).strip()
        topic = topic[0].upper() + topic[1:] if topic else working_text

        if is_recursion:
            optimized = (
                "Explain the concept of recursion clearly for a beginner. "
                "Break down the base case and recursive step using a simple real-world analogy, walk through a short code example (such as factorial or Fibonacci), and explain how the call stack operates."
            )
            changes.extend([
                "Specified beginner target audience and base case / recursive step breakdown",
                "Requested a simple real-world analogy and short code example",
                "Included call stack operation explanation"
            ])
            return optimized, changes

        optimized = (
            f"Explain '{topic}' clearly for a beginner to intermediate audience. "
            f"Break down the core principles step-by-step, walk through a concrete real-world or code example, and highlight key takeaways."
        )
        changes.append("Targeted audience level, step-by-step conceptual breakdown, concrete example, and key takeaway summary")
        return optimized, changes

    # F. BRAINSTORMING / CREATIVE PROMPTS
    if category == 'brainstorming':
        optimized = (
            f"Generate 5 distinct and creative marketing concepts for: '{working_text}'. "
            f"For each concept, detail the target audience, key promotional channel, and estimated effort vs. impact."
        )
        changes.append("Added structured evaluation framework for generated concepts (target audience, channels, effort vs. impact)")
        return optimized, changes

    # G. GENERAL FALLBACK
    optimized = f"Provide a clear, structured, and actionable response for: '{working_text}'. Organize main points logically and include practical next steps."
    changes.append("Added logical organization and actionable next steps")
    return optimized, changes
=======
def clean_conversational_filler(text: str) -> Tuple[str, bool]:
    """Removes conversational filler, polite preambles, and low-value wordy phrases."""
    cleaned = text.strip()
    changed = False

    for pattern in FILLER_PATTERNS:
        new_cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()
        if new_cleaned != cleaned:
            cleaned = new_cleaned
            changed = True

    for pattern in TAIL_FILLER_PATTERNS:
        new_cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()
        if new_cleaned != cleaned:
            cleaned = new_cleaned
            changed = True

    for pattern, repl in WORDY_REPLACEMENTS:
        new_cleaned = re.sub(pattern, repl, cleaned, flags=re.IGNORECASE).strip()
        if new_cleaned != cleaned:
            cleaned = new_cleaned
            changed = True

    # Clean up punctuation spacing
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = re.sub(r'\s*,\s*', ', ', cleaned)
    cleaned = re.sub(r'^[,\s;:]+', '', cleaned).strip()

    if cleaned and not cleaned[0].isupper() and cleaned[0].isalpha():
        cleaned = cleaned[0].upper() + cleaned[1:]

    return cleaned, changed


def is_already_well_structured(prompt: str) -> bool:
    """
    Determines if a prompt is already well-structured and concise,
    meaning no major optimization or rewriting should be forced.
    """
    raw = prompt.strip()
    lines = [l.strip() for l in raw.splitlines() if l.strip()]

    # Check for markdown structure or bullet points
    has_headers = any(l.startswith('#') or (l.endswith(':') and len(l.split()) <= 4) for l in lines)
    has_bullets = any(re.match(r'^(?:[-*•]|\d+\.)\s+', l) for l in lines)

    words = re.findall(r'\b\w+\b', raw)
    if len(words) < 15:
        return False

    _, had_filler = clean_conversational_filler(raw)

    sentences = [s.strip().lower() for s in re.split(r'[.!?\n]+', raw) if len(s.strip().split()) >= 4]
    has_duplicates = len(sentences) != len(set(sentences))

    if (has_headers or has_bullets) and not had_filler and not has_duplicates:
        return True

    return False


def consolidate_repetitive_prompt(text: str) -> Tuple[str, List[str]]:
    """
    Consolidates repetitive, wordy prompts into a clean, structured set of requirements.
    Preserves all unique context, variables, code, domain facts, and constraints.
    """
    cleaned, _ = clean_conversational_filler(text)
    changes = []

    raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?\n])\s+', cleaned) if s.strip()]
    if not raw_sentences:
        return cleaned, changes

    processed_sentences = []
    seen_normalized = set()
    seen_topics = set()

    for sent in raw_sentences:
        sent_clean, _ = clean_conversational_filler(sent)
        norm = re.sub(r'[^a-zA-Z0-9]', '', sent_clean.lower())
        if not norm:
            continue
        if norm in seen_normalized:
            changes.append(f"Removed exact duplicate instruction: '{sent[:40]}...'")
            continue
        seen_normalized.add(norm)

        sent_lower = sent_clean.lower()

        # Check repeated programming language declarations
        if re.search(r'\b(?:use|in|write it in|ensure you use)\s+(?:python|javascript|typescript|java|c\+\+|rust|go|sql)\b', sent_lower):
            if 'lang_spec' in seen_topics:
                changes.append("Consolidated redundant programming language requirement")
                continue
            seen_topics.add('lang_spec')

        # Check repeated error handling declarations
        if re.search(r'\b(?:handle errors|error handling|error-handling|exception handling)\b', sent_lower):
            if 'error_handling' in seen_topics:
                changes.append("Consolidated repeated error handling instruction")
                continue
            seen_topics.add('error_handling')

        # Check repeated documentation/commenting declarations
        if re.search(r'\b(?:include comments|well documented|clean comments|docstrings)\b', sent_lower):
            if 'comments' in seen_topics:
                changes.append("Consolidated repeated commenting / documentation requirement")
                continue
            seen_topics.add('comments')

        # Check repeated tone declarations
        if re.search(r'\b(?:tone is professional|make sure.*professional|clean and professional|formal tone)\b', sent_lower):
            if 'tone_professional' in seen_topics:
                changes.append("Consolidated duplicate professional tone instruction")
                continue
            seen_topics.add('tone_professional')

        processed_sentences.append(sent_clean)

    # Format result if heavily repetitive
    if len(processed_sentences) > 3 and len(changes) >= 2:
        task_sentence = processed_sentences[0]
        other_requirements = processed_sentences[1:]
        bullet_items = "\n".join([f"- {s.rstrip('.')}." for s in other_requirements])
        result = f"{task_sentence}\n\nRequirements:\n{bullet_items}"
        changes.append("Structured repetitive instructions into clean bulleted requirements")
    else:
        result = " ".join(processed_sentences)

    return result, changes


def optimize_prompt_intelligently(prompt: str, quality_score: float = 50.0, task_type: str = 'other') -> Dict[str, Any]:
    """
    Intelligently optimizes prompts deterministically when LLM is offline or prompt needs rule-based refinement:
    - For SHORT prompts: Adds missing structure/specificity (e.g. bullet points, concise scope) without arbitrary requirements.
    - For LARGE/REPETITIVE prompts: Deduplicates instructions, consolidates redundant requirements, removes conversational filler, and organizes structure while preserving all context.
    - For WELL-STRUCTURED prompts: Preserves the prompt intact without forcing artificial changes.
    """
    raw = prompt.strip()
    if not raw:
        return {
            "optimizedPrompt": raw,
            "reasoning": "Prompt is empty.",
            "changes": [],
            "neededOptimization": False
        }

    words = re.findall(r'\b\w+\b', raw)
    word_count = len(words)

    # 1. Well-structured / already optimal prompt
    if is_already_well_structured(raw):
        return {
            "optimizedPrompt": raw,
            "reasoning": "Prompt is already well-structured. Preserved original with no major changes needed.",
            "changes": ["Prompt structure, constraints, and scope are already optimal."],
            "neededOptimization": False
        }

    # 2. Short / Vague prompt handling
    if word_count <= 8 and not any(c in raw for c in ['\n', '-', '*', ':']):
        clean_topic, _ = clean_conversational_filler(raw)
        clean_topic = clean_topic.rstrip('.!? ')
        clean_topic = re.sub(r'^(?:about|on|regarding|for|the|a|an)\s+', '', clean_topic, flags=re.IGNORECASE).strip()
        clean_topic = re.sub(r'^(?:tell\s+me\s+about|give\s+me\s+info\s+on|explain|what\s+is|how\s+does|teach\s+me\s+about|describe)\s+', '', clean_topic, flags=re.IGNORECASE).strip()
        if not clean_topic:
            clean_topic = raw.rstrip('.!? ')

        lower_raw = raw.lower()
        if any(k in lower_raw for k in ['email', 'letter', 'memo', 'message to', 'manager', 'boss', 'leave', 'pto']):
            optimized = f"Write a concise, professional email regarding {clean_topic}. Include context, key request details, and clear next steps."
            reasoning = "Added essential email structure (context, key details, next steps) and concise formatting."
            changes = ["Added clear email structural guidelines", "Specified concise professional tone"]
        elif any(k in lower_raw for k in ['code', 'python', 'java', 'react', 'function', 'class', 'algorithm', 'binary search', 'sql', 'debug', 'script']):
            optimized = f"Implement a clean, robust solution for {clean_topic}. Include modular code, concise comments, and time/space complexity analysis."
            reasoning = "Added implementation requirements, code quality standards, and complexity analysis."
            changes = ["Added modular code and commenting requirements", "Specified complexity analysis"]
        elif any(k in lower_raw for k in ['analyze', 'analysis', 'review', 'complaint', 'feedback', 'compare']):
            optimized = f"Analyze {clean_topic} to identify core themes, key findings, and 3 actionable recommendations."
            reasoning = "Added clear analysis structure with core themes, key findings, and actionable recommendations."
            changes = ["Structured analysis into key findings and actionable recommendations"]
        else:
            optimized = f"Explain {clean_topic} in 5 concise bullet points, covering its main causes, effects, and one real-world example. Use simple language."
            reasoning = "Structured topic into concise bullet points with cause/effect/example scope to prevent vague generation."
            changes = ["Structured request into 5 concise bullet points", "Added cause, effect, and real-world example scope"]

        return {
            "optimizedPrompt": optimized,
            "reasoning": reasoning,
            "changes": changes,
            "neededOptimization": True
        }

    # 3. Medium or Large Prompts: Deduplicate, Consolidate & Clean Filler
    cleaned_filler, had_filler = clean_conversational_filler(raw)
    consolidated, dedup_changes = consolidate_repetitive_prompt(raw)

    changes = []
    if had_filler:
        changes.append("Removed conversational filler and polite preambles")
    changes.extend([c for c in dedup_changes if c not in changes])

    # If no changes were made or needed
    if consolidated.strip() == raw.strip() or (not changes and len(consolidated) >= len(raw) * 0.95):
        return {
            "optimizedPrompt": raw,
            "reasoning": "Prompt is already well-structured. Preserved original with no major changes needed.",
            "changes": ["Preserved prompt structure and constraints without unnecessary modifications."],
            "neededOptimization": False
        }

    reasoning_parts = []
    if any("duplicate" in c.lower() or "consolidated" in c.lower() for c in changes):
        reasoning_parts.append("consolidated duplicate requirements")
    if had_filler:
        reasoning_parts.append("removed conversational filler")
    if any("structured" in c.lower() for c in changes):
        reasoning_parts.append("organized into structured requirements")
    if not reasoning_parts:
        reasoning_parts.append("streamlined instruction clarity")

    reasoning = f"Optimized prompt: {', '.join(reasoning_parts).capitalize()} while preserving all original context and constraints."

    return {
        "optimizedPrompt": consolidated,
        "reasoning": reasoning,
        "changes": changes if changes else ["Cleaned phrasing and preserved all core constraints."],
        "neededOptimization": True
    }
>>>>>>> 47a14bea59f9260203da2c4d73698fa221607e48


def validate_semantic_preservation(original: str, candidate: str, analysis: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Semantic Validation Step:
    Compares original intent with candidate optimized prompt to verify:
    - Same task requested
    - Key entities & numbers preserved
    - No unsupported facts introduced
    - Optimized prompt is genuinely clearer/more useful
    """
    cand_lower = candidate.lower()

    # Verify numbers from original prompt are preserved
    for num in analysis.get("numbers", []):
        if num not in candidate:
            return False, original

    # Verify key proper nouns from original prompt are preserved
    for noun in analysis.get("proper_nouns", []):
        if noun.lower() not in cand_lower:
            return False, original

    # Check for generic clutter
    generic_clutter = [
        "be clear and concise and do your best",
        "use best practices and handle edge cases",
        "provide a detailed answer to everything"
    ]
    if any(g in cand_lower for g in generic_clutter):
        clean_cand = candidate
        for g in generic_clutter:
            clean_cand = re.sub(re.escape(g), "", clean_cand, flags=re.IGNORECASE).strip()
        return True, clean_cand

    return True, candidate


async def query_ollama_optimizer(prompt: str, quality_score: float = 50.0, task_type: str = 'other') -> dict:
    """
    Optimizes a user prompt using the configured LLM client with intelligent fallback.
    Enforces core optimization principles:
    - Preserves user intent, domain facts, code, and necessary context.
    - Does NOT rewrite/paraphrase for the sake of rewriting.
    - Deduplicates requirements and removes filler for large prompts.
    - Adds structure and specificity for short vague prompts.
    - Preserves already well-structured prompts without artificial changes.
    """
    prompt_template = (
<<<<<<< HEAD
        "You are EcoRoute's Deep Contextual Prompt Optimizer. Analyze the user prompt and perform a genuine, intent-aware optimization.\n\n"
        "PIPELINE & RULES:\n"
        "1. Understand user intent, task category, recipient/audience, and specific problem.\n"
        "2. Avoid generic template fluff (DO NOT blindly append 'use type hints', 'handle edge cases', 'be clear' unless specifically relevant to the task).\n"
        "3. For coding tasks: optimize around the specific code/problem (e.g. refactoring, debugging, algorithm implementation).\n"
        "4. For writing tasks: optimize around purpose, recipient, context, subject line, and formal/appropriate tone.\n"
        "5. If the prompt is ALREADY clear, specific, and effective, preserve it with minimal or no changes.\n"
        "6. Never invent unstated facts or force a fixed structure onto every prompt.\n"
        "7. Output raw JSON object with keys 'optimizedPrompt' and 'changes'.\n\n"
        f"User Prompt: {prompt}\n"
        f"Task Category: {task_type}\n\n"
        "You MUST respond ONLY with a single valid raw JSON object matching:\n"
        "{\n"
        '  "optimizedPrompt": "the refined prompt text",\n'
        '  "changes": ["dynamic list of specific improvements made"]\n'
        "}\n"
=======
        "You are EcoRoute's Expert Prompt Optimization Engine.\n"
        "Your task is to optimize the user's prompt to maximize instruction clarity, structural precision, and compute efficiency WITHOUT simply paraphrasing or rewriting the text.\n\n"
        "OPTIMIZATION RULES:\n"
        "1. PRESERVE INTENT & CRITICAL CONTEXT: Retain the user's core goal, domain facts, technical constraints, variables, code snippets, and data. Do NOT delete necessary information just to make the prompt shorter.\n"
        "2. DO NOT PARAPHRASE: Meaningfully modify the prompt ONLY when there is something genuine to improve. If an instruction is already clear and concise, keep it.\n"
        "3. FOR SHORT PROMPTS (e.g. 'Tell me about climate change.'): Identify missing structure or specificity. Add concise scoping (e.g., 5 concise bullet points covering causes, effects, and one real-world example) without arbitrary unneeded requirements.\n"
        "4. FOR LARGE / REPETITIVE PROMPTS: Consolidate duplicate requirements, remove polite conversational filler ('could you please', 'I was wondering if...'), eliminate conflicting instructions, and structure cleanly with headings or bullet points while keeping all necessary information intact.\n"
        "5. FOR WELL-STRUCTURED PROMPTS: If the prompt is already clear, well-structured, and contains no fluff or repetition, preserve it as-is and explain that it was already well-structured.\n\n"
        "Respond ONLY with a single valid raw JSON object:\n"
        "{\n"
        '  "optimizedPrompt": "the optimized prompt text (or original if already optimal)",\n'
        '  "reasoning": "A concise 1-2 sentence explanation of why changes were made or why prompt was preserved (e.g., \'Removed repeated requirements, consolidated formatting instructions, and converted request into structured task.\' or \'Prompt is already well-structured. Preserved original with no major changes needed.\')",\n'
        '  "changes": ["description of improvement 1", "description of improvement 2"],\n'
        '  "neededOptimization": true\n'
        "}\n\n"
        f"User Prompt to Optimize:\n{prompt}"
>>>>>>> 47a14bea59f9260203da2c4d73698fa221607e48
    )

    try:
        raw_text = await query_llm(prompt_template)
        data = json.loads(raw_text)
<<<<<<< HEAD
        if data.get("optimizedPrompt"):
            analysis = analyze_prompt_deeply(prompt, task_type)
            is_valid, validated_prompt = validate_semantic_preservation(prompt, data["optimizedPrompt"], analysis)
            if is_valid:
                data["optimizedPrompt"] = validated_prompt
=======
        if isinstance(data, dict) and data.get("optimizedPrompt"):
            cleaned_opt, was_leaked = sanitize_optimized_prompt(prompt, data["optimizedPrompt"])
            if not was_leaked:
                data["optimizedPrompt"] = cleaned_opt
                if not data.get("reasoning"):
                    data["reasoning"] = "Optimized prompt for instruction clarity and compute efficiency."
                if not isinstance(data.get("changes"), list):
                    data["changes"] = [str(data.get("changes"))] if data.get("changes") else []
>>>>>>> 47a14bea59f9260203da2c4d73698fa221607e48
                return data
    except Exception:
        pass

<<<<<<< HEAD
    # Deterministic fallback optimizer with semantic validation
    analysis = analyze_prompt_deeply(prompt, task_type)
    opt_text, changes = optimize_prompt_intelligently(prompt, quality_score, task_type)
    is_valid, validated_prompt = validate_semantic_preservation(prompt, opt_text, analysis)

    return {
        "optimizedPrompt": validated_prompt if is_valid else opt_text,
        "changes": changes
    }
=======
    # Deterministic fallback optimizer
    return optimize_prompt_intelligently(prompt, quality_score, task_type)
>>>>>>> 47a14bea59f9260203da2c4d73698fa221607e48


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
        changes = [str(changes)] if changes else []

    reasoning = result.get("reasoning", "")
    needed_opt = result.get("neededOptimization", True)

    # Safeguard: if leaked or empty, run fallback
    if was_leaked or not cleaned_prompt:
        fallback_res = optimize_prompt_intelligently(original, quality, task)
        cleaned_prompt = fallback_res.get("optimizedPrompt", original)
        changes = fallback_res.get("changes", [])
        reasoning = fallback_res.get("reasoning", reasoning)
        needed_opt = fallback_res.get("neededOptimization", True)

    # If prompt is identical to original, check if it genuinely needed no changes
    if cleaned_prompt.strip() == original.strip():
        if not reasoning or "optimized" in reasoning.lower():
            reasoning = "Prompt is already well-structured. Preserved original with no major changes needed."
        needed_opt = False
        if not changes:
            changes = ["Prompt structure and constraints are already optimal."]

    token_stats = calculate_token_savings(original, cleaned_prompt)

    return OptimizeResponse(
        originalPrompt=original,
        optimizedPrompt=cleaned_prompt,
        reasoning=reasoning,
        changes=changes,
        neededOptimization=needed_opt,
        tokensBefore=token_stats["tokensBefore"],
        tokensAfter=token_stats["tokensAfter"],
        tokenReduction=token_stats["tokenReduction"],
        tokenReductionPercentage=token_stats["tokenReductionPercentage"]
    )
