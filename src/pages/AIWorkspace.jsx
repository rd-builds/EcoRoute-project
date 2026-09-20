import { useState, useRef, useEffect } from 'react';
import { analyzePrompt } from '../api/backend';
import { useAuth } from '../context/AuthContext';

export default function AIWorkspace() {
  const { saveAnalysis } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [task, setTask] = useState('coding');
  const [currentAI, setCurrentAI] = useState('ChatGPT');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Voice-to-Intent States
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [wasVoiceUsed, setWasVoiceUsed] = useState(false);
  const recognitionRef = useRef(null);

  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const isSpeechSupported = Boolean(SpeechRecognition);

  const startListening = () => {
    if (!isSpeechSupported) {
      setVoiceError("Voice input isn't supported in this browser. You can still type your request.");
      return;
    }
    if (isListening) return;

    setVoiceError(null);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setWasVoiceUsed(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setPrompt(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('Microphone permission was denied. Please check your browser settings.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech was detected. Please try speaking again.');
        } else if (event.error !== 'aborted') {
          setVoiceError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setVoiceError('Failed to access microphone or start voice input.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore error if already stopped
      }
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // cleanup
        }
      }
    };
  }, []);

  const samplePrompts = [
    {
      title: "Simple Math",
      text: "What is 25 * 48?",
      task: "other"
    },
    {
      title: "Unit Conversion",
      text: "Convert 5 km to meters.",
      task: "other"
    },
    {
      title: "Task Organization",
      text: "Give me 5 ways to organize my daily tasks.",
      task: "other"
    },
    {
      title: "Complaint Analysis",
      text: "Analyze these 50 customer complaints and identify recurring themes.",
      task: "research"
    },
    {
      title: "Professional Rewrite",
      text: "Rewrite this email to sound professional and concise.",
      task: "writing"
    }
  ];

  const handleAnalyze = async (overridePrompt = null, overrideTask = null) => {
    const promptToUse = overridePrompt !== null ? overridePrompt : prompt;
    const taskToUse = overrideTask !== null ? overrideTask : task;

    if (!promptToUse.trim()) {
      setError('Please enter a prompt to analyze.');
      return;
    }

    // Stop listening if user clicks analyze while recording
    if (isListening) {
      stopListening();
    }

    setError(null);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const data = await analyzePrompt({
        prompt: promptToUse,
        task: taskToUse,
        currentAI: currentAI,
        history: []
      });
      setAnalysisResult(data);

      if (saveAnalysis) {
        saveAnalysis({
          ...data,
          prompt: promptToUse,
          taskType: data.taskType || taskToUse,
          originalTokens: data.tokensBefore,
          optimizedTokens: data.tokensAfter,
          reductionPercentage: data.tokenReductionPercentage,
          modelReasoning: data.reason,
          efficiencyRating: data.greenScore >= 80 ? 'Optimal Compute Tier' : data.greenScore >= 50 ? 'Moderate Efficiency' : 'Low Efficiency',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to connect to the backend server. Please ensure FastAPI is running on http://127.0.0.1:8000.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!analysisResult?.optimizedPrompt) return;
    navigator.clipboard.writeText(analysisResult.optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImproveBeforeGenerating = () => {
    if (!analysisResult?.optimizedPrompt) return;
    setWasVoiceUsed(false);
    setPrompt(analysisResult.optimizedPrompt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const textarea = document.querySelector('.prompt-textarea');
      if (textarea) textarea.focus();
    }, 300);
  };

  const selectSamplePrompt = (sample) => {
    setWasVoiceUsed(false);
    setPrompt(sample.text);
    setTask(sample.task);
    handleAnalyze(sample.text, sample.task);
  };

  const getRiskBadgeColor = (risk) => {
    const r = (risk || '').toLowerCase();
    if (r === 'low') return 'risk-badge-low';
    if (r === 'medium') return 'risk-badge-medium';
    if (r === 'high') return 'risk-badge-high';
    return 'risk-badge-low';
  };

  const getIntentSummary = (promptText, taskType) => {
    const lower = (promptText || '').toLowerCase();
    if (lower.includes('birthday') || lower.includes('party') || lower.includes('creative ideas')) return 'Creative Idea Generation';
    if (lower.includes('complaint') || lower.includes('customer review') || lower.includes('reviews')) return 'Customer Feedback Analysis';
    if (lower.includes('organize') || lower.includes('daily task') || lower.includes('tasks')) return 'Task Organization & Planning';
    if (lower.includes('convert') || lower.includes('km') || lower.includes('meters')) return 'Unit / Metric Conversion';
    if (lower.includes('*') || lower.includes('+') || lower.includes('/') || lower.includes('math') || lower.includes('calculate') || lower.includes('25 * 48')) return 'Arithmetic Calculation';
    if (lower.includes('email') || lower.includes('rewrite') || lower.includes('letter')) return 'Text Rewriting & Formatting';

    const map = {
      coding: 'Software Development & Code Analysis',
      writing: 'Content Editing & Drafting',
      research: 'Research & Information Extraction',
      summarization: 'Document Summarization',
      brainstorming: 'Creative Brainstorming',
      education: 'Educational Concept Explanation',
      other: 'General Inquiry / Task Analysis'
    };
    return map[taskType] || 'General Inquiry';
  };

  return (
    <div className="workspace-container">
      {/* Header */}
      <div className="workspace-header">
        <div className="workspace-tag">GreenMind Intelligence</div>
        <h1 className="workspace-title">AI Workspace</h1>
        <p className="workspace-subtitle">
          Use AI more intentionally. Generate less unnecessary output.
        </p>
      </div>

      {/* Main Prompt Input Box with Voice-to-Intent */}
      <div className="workspace-card prompt-card">
        {/* Voice-to-Intent Control Bar */}
        <div className="voice-intent-bar">
          <div className="voice-intent-label-group">
            <span className="voice-intent-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
              Voice → Intent
            </span>
            <span className="voice-intent-subtitle">
              Speak naturally. EcoRoute figures out what the task needs.
            </span>
          </div>

          <div className="voice-actions">
            {!isSpeechSupported ? (
              <div className="voice-unsupported-tag">
                <span>Voice input isn't supported in this browser. You can still type your request.</span>
              </div>
            ) : isListening ? (
              <div className="voice-recording-wrapper">
                <div className="listening-indicator">
                  <span className="pulsing-red-dot"></span>
                  <span className="listening-txt">Listening... "Tell EcoRoute what you need..."</span>
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  className="btn-voice-stop"
                  title="Stop recording"
                >
                  <span className="stop-square"></span>
                  Stop Recording
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startListening}
                className="btn-voice-start"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
                Speak your request
              </button>
            )}
          </div>
        </div>

        {voiceError && (
          <div className="voice-error-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{voiceError}</span>
            <button onClick={() => setVoiceError(null)} className="voice-error-close">✕</button>
          </div>
        )}

        <textarea
          className={`prompt-textarea ${isListening ? 'listening-active' : ''}`}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setWasVoiceUsed(false);
          }}
          placeholder={isListening ? "Listening... Speak your request naturally..." : "What do you want AI to help you with?"}
          rows={4}
        />

        <div className="prompt-controls">
          <div className="selectors-group">
            <div className="select-wrapper">
              <label htmlFor="task-select">Task Type</label>
              <select
                id="task-select"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="workspace-select"
              >
                <option value="coding">Coding</option>
                <option value="writing">Writing</option>
                <option value="research">Research</option>
                <option value="summarization">Summarization</option>
                <option value="brainstorming">Brainstorming</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="select-wrapper">
              <label htmlFor="ai-select">Current AI Tool</label>
              <select
                id="ai-select"
                value={currentAI}
                onChange={(e) => setCurrentAI(e.target.value)}
                className="workspace-select"
              >
                <option value="ChatGPT">ChatGPT</option>
                <option value="Claude">Claude</option>
                <option value="Gemini">Gemini</option>
                <option value="Copilot">Copilot</option>
                <option value="Perplexity">Perplexity</option>
                <option value="DeepSeek">DeepSeek</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing}
            className="btn-solid btn-analyze"
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                Analyze
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#050602" strokeWidth="2.2" strokeLinecap="square" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="workspace-error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Before Analysis: Empty State */}
      {!analysisResult && !isAnalyzing && (
        <div className="workspace-empty-state">
          <div className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="1.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <h3>Ready for Intelligence Analysis</h3>
          <p>
            Enter a prompt above to evaluate its Green Score, detect AI slop risk, calculate token efficiency, and receive a model recommendation.
          </p>

          <div className="sample-prompts">
            <span className="sample-label">Try a sample prompt:</span>
            <div className="sample-chips">
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  className="sample-chip"
                  onClick={() => selectSamplePrompt(s)}
                >
                  <span className="chip-tag">{s.title}</span>
                  <span className="chip-text">"{s.text}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isAnalyzing && (
        <div className="workspace-loading-state">
          <div className="pulse-circle"></div>
          <p>Evaluating prompt efficiency, slop risks, and model recommendations...</p>
        </div>
      )}

      {/* After Analysis: Output Display Sections */}
      {analysisResult && !isAnalyzing && (
        <div className="analysis-grid">
          
          {/* Voice-to-Intent Summary Banner */}
          <div className="voice-interpretation-card full-width">
            <div className="voice-interp-header">
              <div className="voice-interp-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
                <span>VOICE → INTENT INTERPRETATION</span>
              </div>
              <span className="voice-interp-tagline">Natural Language Request Analyzed</span>
            </div>

            <div className="voice-interp-grid">
              <div className="voice-interp-item">
                <span className="voice-interp-label">EcoRoute understood</span>
                <span className="voice-interp-value">{getIntentSummary(prompt, analysisResult.taskType)}</span>
              </div>
              <div className="voice-interp-item">
                <span className="voice-interp-label">Compute Recommendation</span>
                <span className={`voice-interp-decision status-${((typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) || '').toLowerCase()}`}>
                  {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_NOT_REQUIRED' && "AI may not be necessary for this task"}
                  {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_OPTIONAL' && "AI is optional for this task"}
                  {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_REQUIRED' && "AI is justified for this task"}
                </span>
              </div>
            </div>
          </div>

          {/* 1. AI Necessity Decision */}
          {analysisResult.aiNecessity && (
            <div className={`workspace-card ai-necessity-card full-width necessity-${((typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) || '').toLowerCase()}`}>
              <div className="card-header space-between">
                <div>
                  <span className="card-tag">01 / AI NECESSITY DECISION</span>
                  <h3 className="necessity-heading">
                    {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_NOT_REQUIRED' && "AI isn't necessary for this task"}
                    {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_OPTIONAL' && "AI is optional for this task"}
                    {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_REQUIRED' && "AI is justified for this task"}
                  </h3>
                </div>
                <span className={`necessity-badge necessity-badge-${((typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) || '').toLowerCase()}`}>
                  {typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity}
                </span>
              </div>

              <div className="necessity-body">
                {/* Reason / Explanation */}
                {typeof analysisResult.aiNecessity === 'object' && analysisResult.aiNecessity.reason && (
                  <p className="necessity-reason">
                    {analysisResult.aiNecessity.reason}
                  </p>
                )}

                {/* Suggested Alternative */}
                {typeof analysisResult.aiNecessity === 'object' && analysisResult.aiNecessity.alternative && (
                  <div className="necessity-alternative-box">
                    <span className="alt-label">Suggested alternative:</span>
                    <span className="alt-value">{analysisResult.aiNecessity.alternative}</span>
                  </div>
                )}

                {/* Footer Conclusion */}
                <div className="necessity-footer-note">
                  {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_REQUIRED' && (
                    <span>EcoRoute: Your prompt is optimized for efficient AI use.</span>
                  )}
                  {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_OPTIONAL' && (
                    <span>EcoRoute: AI can be used, but a simpler non-AI approach may work.</span>
                  )}
                  {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_NOT_REQUIRED' && (
                    <span>EcoRoute: Avoided unnecessary LLM compute. Use a lightweight alternative instead.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 1.5 AI Usage Receipt */}
          {analysisResult.aiNecessity && (
            <div className="workspace-card ai-receipt-card full-width">
              <div className="card-header space-between">
                <div>
                  <span className="card-tag">RECEIPT / ECO-EFFICIENCY STATEMENT</span>
                  <h3>🧾 AI Usage Receipt</h3>
                </div>
                <span className="receipt-timestamp">
                  EcoRoute Verified
                </span>
              </div>

              <div className="receipt-body">
                {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_NOT_REQUIRED' ? (
                  <>
                    <div className="receipt-grid">
                      <div className="receipt-item">
                        <span className="receipt-label">AI necessity</span>
                        <span className="receipt-val warning">🚫 AI not required</span>
                      </div>
                      <div className="receipt-item">
                        <span className="receipt-label">EcoRoute recommendation</span>
                        <span className="receipt-val">Use a lightweight alternative instead.</span>
                      </div>
                      <div className="receipt-item">
                        <span className="receipt-label">Potential unnecessary AI inference avoided</span>
                        <span className="receipt-val highlight">Yes</span>
                      </div>
                    </div>
                    {typeof analysisResult.aiNecessity === 'object' && analysisResult.aiNecessity.alternative && (
                      <div className="receipt-alt-box">
                        <span className="receipt-label">Suggested alternative</span>
                        <span className="receipt-alt-value">{analysisResult.aiNecessity.alternative}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="receipt-grid">
                      <div className="receipt-item">
                        <span className="receipt-label">AI necessity</span>
                        <span className="receipt-val">
                          {(typeof analysisResult.aiNecessity === 'object' ? analysisResult.aiNecessity.status : analysisResult.aiNecessity) === 'AI_REQUIRED'
                            ? '✅ AI justified'
                            : '⚠️ AI optional'}
                        </span>
                      </div>
                      <div className="receipt-item">
                        <span className="receipt-label">Prompt efficiency</span>
                        <span className="receipt-val highlight">
                          {analysisResult.tokenReductionPercentage > 0
                            ? `${analysisResult.tokenReductionPercentage}%`
                            : `${analysisResult.greenScore || 85}%`}
                        </span>
                      </div>
                      <div className="receipt-item">
                        <span className="receipt-label">Model choice</span>
                        <span className="receipt-val">{analysisResult.recommendedModel || 'Right-sized model'}</span>
                      </div>
                      <div className="receipt-item">
                        <span className="receipt-label">Output</span>
                        <span className="receipt-val">
                          {analysisResult.slop?.outputBloat === 'high' ? 'Bloat Risk' : 'Right-sized'}
                        </span>
                      </div>
                      <div className="receipt-item">
                        <span className="receipt-label">Avoidable computation</span>
                        <span className="receipt-val highlight">
                          {analysisResult.tokenReductionPercentage > 0
                            ? `~${analysisResult.tokenReductionPercentage}%`
                            : 'Potentially avoidable computation detected'}
                        </span>
                      </div>
                    </div>

                    <div className="receipt-changes-section">
                      <span className="changes-title">What EcoRoute changed</span>
                      <ul className="receipt-changes-list">
                        <li>• Removed unnecessary/repeated instructions</li>
                        <li>• Reduced unnecessary output bloat risk</li>
                        <li>• Selected a more appropriate model ({analysisResult.recommendedModel || 'Right-sized'})</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. Prompt Optimization & Comparison Engine */}
          <div className="workspace-card prompt-opt-card full-width">
            <div className="card-header space-between">
              <div>
                <span className="card-tag">02 / PROMPT OPTIMIZATION</span>
                <h3>Prompt Optimization Engine</h3>
              </div>
              <div className="prompt-opt-header-actions">
                <button
                  onClick={handleCopyPrompt}
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Optimized Prompt
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Optimization Strategy & Reasoning */}
            <div className="opt-reasoning-banner">
              <div className="opt-reasoning-header">
                <span className="opt-reasoning-icon">💡</span>
                <span className="opt-reasoning-title">Optimization Strategy:</span>
                <span className={`opt-status-badge ${analysisResult.optimizedPrompt.trim() === (analysisResult.originalPrompt || prompt).trim() ? 'status-preserved' : 'status-optimized'}`}>
                  {analysisResult.optimizedPrompt.trim() === (analysisResult.originalPrompt || prompt).trim()
                    ? 'Preserved (Already Well-Structured)'
                    : analysisResult.tokenReductionPercentage > 0
                    ? `Token Savings: ${analysisResult.tokenReductionPercentage}%`
                    : 'Structure & Scope Added'}
                </span>
              </div>
              <p className="opt-reasoning-text">
                {analysisResult.reasoning || "Optimized prompt for instruction clarity and compute efficiency while preserving core intent."}
              </p>
            </div>

            {/* Comparison Grid */}
            <div className="prompt-comparison-grid">
              {/* Original Prompt */}
              <div className="prompt-compare-col">
                <div className="compare-col-header">
                  <span className="compare-col-title">Original Prompt</span>
                  <span className="compare-token-pill">{analysisResult.tokensBefore} tokens</span>
                </div>
                <div className="compare-content-box original-box">
                  <code>{analysisResult.originalPrompt || prompt}</code>
                </div>
              </div>

              {/* Optimized Prompt */}
              <div className="prompt-compare-col">
                <div className="compare-col-header">
                  <span className="compare-col-title">Optimized Prompt</span>
                  <span className="compare-token-pill highlight">{analysisResult.tokensAfter} tokens</span>
                </div>
                <div className="compare-content-box optimized-box">
                  <code>{analysisResult.optimizedPrompt}</code>
                </div>
              </div>
            </div>

            {/* Specific Changes Made */}
            {analysisResult.changes && analysisResult.changes.length > 0 && (
              <div className="opt-changes-summary">
                <span className="changes-summary-title">Optimization Actions:</span>
                <ul className="opt-changes-bullets">
                  {analysisResult.changes.map((change, idx) => (
                    <li key={idx}>• {change}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 3. Recommended Model */}
          <div className="workspace-card model-card">
            <div className="card-header">
              <span className="card-tag">03 / COMPUTE RIGHT-SIZING</span>
              <h3>Recommended Model</h3>
            </div>

            <div className="model-body">
              <div className="model-badge-row">
                <span className="model-name">{analysisResult.recommendedModel}</span>
              </div>
              <p className="model-reason">{analysisResult.reason}</p>
            </div>
          </div>

          {/* 4. Slop / Output Analysis */}
          <div className="workspace-card slop-card">
            <div className="card-header">
              <span className="card-tag">04 / GENERATION RISKS</span>
              <div className="header-with-badge">
                <h3>Slop Risk</h3>
                <span className={`risk-badge ${getRiskBadgeColor(analysisResult.slop?.risk)}`}>
                  {analysisResult.slop?.risk?.toUpperCase() || 'LOW'}
                </span>
              </div>
            </div>

            <div className="slop-signals-grid">
              <div className="signal-item">
                <div className="signal-header">
                  <span className="signal-title">Repetition Risk</span>
                  <span className={`signal-val ${getRiskBadgeColor(analysisResult.slop?.repetitionRisk)}`}>
                    {analysisResult.slop?.repetitionRisk?.toUpperCase() || 'LOW'}
                  </span>
                </div>
                <p className="signal-desc">
                  {analysisResult.slop?.repetitionRiskExplanation ||
                    (analysisResult.slop?.repetitionRisk === 'high' || analysisResult.slop?.repetitionRisk === 'medium'
                      ? 'Request asks for multiple similar variations.'
                      : 'The prompt is specific enough to reduce repeated ideas.')}
                </p>
              </div>

              <div className="signal-item">
                <div className="signal-header">
                  <span className="signal-title">Output Bloat</span>
                  <span className={`signal-val ${getRiskBadgeColor(analysisResult.slop?.outputBloat)}`}>
                    {analysisResult.slop?.outputBloat?.toUpperCase() || 'LOW'}
                  </span>
                </div>
                <p className="signal-desc">
                  {analysisResult.slop?.outputBloatExplanation ||
                    (analysisResult.slop?.outputBloat === 'high' || analysisResult.slop?.outputBloat === 'medium'
                      ? 'Requests large volume of unconstrained text.'
                      : 'The requested response has a clear scope.')}
                </p>
              </div>

              <div className="signal-item">
                <div className="signal-header">
                  <span className="signal-title">Regeneration Risk</span>
                  <span className={`signal-val ${getRiskBadgeColor(analysisResult.slop?.regenerationRisk)}`}>
                    {analysisResult.slop?.regenerationRisk?.toUpperCase() || 'LOW'}
                  </span>
                </div>
                <p className="signal-desc">
                  {analysisResult.slop?.regenerationRiskExplanation ||
                    (analysisResult.slop?.regenerationRisk === 'high' || analysisResult.slop?.regenerationRisk === 'medium'
                      ? 'The prompt leaves some room for interpretation.'
                      : 'Clear context minimizes need for re-prompts.')}
                </p>
              </div>
            </div>

            <div className="slop-text-block">
              <div className="text-group">
                <span className="group-label">Reason</span>
                <p>{analysisResult.slop?.reason || "The request doesn't specify a target audience, format, or level of detail."}</p>
              </div>
              <div className="text-group">
                <span className="group-label">Suggestion</span>
                <p className="suggestion-text">{analysisResult.slop?.suggestion || "Add a target audience, desired format, and specific requirements to make the output more focused."}</p>
              </div>
            </div>

            <div className="slop-action-row">
              <button
                className="btn-improve-risk"
                onClick={handleImproveBeforeGenerating}
              >
                Improve before generating →
              </button>
            </div>
          </div>

          {/* 5. Green Score */}
          <div className="workspace-card score-card">
            <div className="card-header">
              <span className="card-tag">05 / EFFICIENCY INDEX</span>
              <h3>Green Score</h3>
            </div>
            
            <div className="score-body">
              <div className="score-visual">
                <svg className="score-ring" viewBox="0 0 120 120">
                  <circle
                    className="ring-bg"
                    cx="60"
                    cy="60"
                    r="52"
                    strokeWidth="8"
                  />
                  <circle
                    className="ring-val"
                    cx="60"
                    cy="60"
                    r="52"
                    strokeWidth="8"
                    style={{
                      strokeDasharray: 326.7,
                      strokeDashoffset: 326.7 - (326.7 * (analysisResult.greenScore || 0)) / 100,
                    }}
                  />
                </svg>
                <div className="score-display">
                  <span className="score-num">{analysisResult.greenScore}</span>
                  <span className="score-denom">/ 100</span>
                </div>
              </div>

              <div className="score-meta">
                <span className="score-label">Internal Relative Efficiency Rating</span>
                <p className="score-desc">
                  Calculated from token compression, right-sized compute tiering, and avoidance of AI generation waste.
                </p>
              </div>
            </div>
          </div>

          {/* Token Efficiency */}
          <div className="workspace-card token-card">
            <div className="card-header">
              <span className="card-tag">TOKEN ARITHMETIC</span>
              <h3>Token Efficiency</h3>
            </div>

            <div className="token-grid">
              <div className="token-metric">
                <span className="metric-label">Tokens Before</span>
                <span className="metric-val">{analysisResult.tokensBefore}</span>
              </div>
              <div className="token-metric">
                <span className="metric-label">Tokens After</span>
                <span className="metric-val highlight">{analysisResult.tokensAfter}</span>
              </div>
              <div className="token-metric">
                <span className="metric-label">Tokens Saved</span>
                <span className="metric-val">{analysisResult.tokenReduction}</span>
              </div>
              <div className="token-metric">
                <span className="metric-label">Token Reduction %</span>
                <span className="metric-val pct">
                  {analysisResult.tokenReductionPercentage > 0 ? `+${analysisResult.tokenReductionPercentage}%` : `${analysisResult.tokenReductionPercentage}%`}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Resource Impact */}
          <div className="workspace-card impact-card full-width">
            <div className="card-header">
              <span className="card-tag">06 / ESTIMATED RESOURCE DEMAND</span>
              <h3>Resource Impact</h3>
            </div>

            <div className="impact-grid">
              <div className="impact-item">
                <div className="impact-icon">⚡</div>
                <div className="impact-info">
                  <span className="impact-label">Energy</span>
                  <span className={`impact-tier ${getRiskBadgeColor(analysisResult.impact?.energy)}`}>
                    {analysisResult.impact?.energy?.toUpperCase() || 'LOW'}
                  </span>
                </div>
              </div>

              <div className="impact-item">
                <div className="impact-icon">💧</div>
                <div className="impact-info">
                  <span className="impact-label">Water</span>
                  <span className={`impact-tier ${getRiskBadgeColor(analysisResult.impact?.water)}`}>
                    {analysisResult.impact?.water?.toUpperCase() || 'LOW'}
                  </span>
                </div>
              </div>

              <div className="impact-item">
                <div className="impact-icon">🌱</div>
                <div className="impact-info">
                  <span className="impact-label">Carbon</span>
                  <span className={`impact-tier ${getRiskBadgeColor(analysisResult.impact?.carbon)}`}>
                    {analysisResult.impact?.carbon?.toUpperCase() || 'LOW'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
