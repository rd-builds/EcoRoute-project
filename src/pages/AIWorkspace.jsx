import { useState } from 'react';
import { analyzePrompt } from '../api/backend';

export default function AIWorkspace() {
  const [prompt, setPrompt] = useState('');
  const [task, setTask] = useState('coding');
  const [currentAI, setCurrentAI] = useState('ChatGPT');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const samplePrompts = [
    {
      title: "React Debugging",
      text: "Debug this React authentication error and explain the fix clearly.",
      task: "coding"
    },
    {
      title: "Repetitive Captions",
      text: "Give me 20 different Instagram captions for my coffee shop.",
      task: "writing"
    },
    {
      title: "10,000-Word Output",
      text: "Write a 10,000-word explanation of HTML.",
      task: "education"
    },
    {
      title: "Simple Math",
      text: "What is 15 * 8?",
      task: "other"
    }
  ];

  const handleAnalyze = async (overridePrompt = null, overrideTask = null) => {
    const promptToUse = overridePrompt !== null ? overridePrompt : prompt;
    const taskToUse = overrideTask !== null ? overrideTask : task;

    if (!promptToUse.trim()) {
      setError('Please enter a prompt to analyze.');
      return;
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

  const selectSamplePrompt = (sample) => {
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

      {/* Main Prompt Input Box */}
      <div className="workspace-card prompt-card">
        <textarea
          className="prompt-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want AI to help you with?"
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

      {/* After Analysis: 6 Output Display Sections */}
      {analysisResult && !isAnalyzing && (
        <div className="analysis-grid">
          
          {/* 1. Green Score */}
          <div className="workspace-card score-card">
            <div className="card-header">
              <span className="card-tag">01 / EFFICIENCY INDEX</span>
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

          {/* 2. Slop Risk */}
          <div className="workspace-card slop-card">
            <div className="card-header">
              <span className="card-tag">02 / GENERATION RISKS</span>
              <div className="header-with-badge">
                <h3>Slop Risk</h3>
                <span className={`risk-badge ${getRiskBadgeColor(analysisResult.slop?.risk)}`}>
                  {analysisResult.slop?.risk?.toUpperCase() || 'LOW'}
                </span>
              </div>
            </div>

            <div className="slop-signals-grid">
              <div className="signal-item">
                <span className="signal-title">Repetition Risk</span>
                <span className={`signal-val ${getRiskBadgeColor(analysisResult.slop?.repetitionRisk)}`}>
                  {analysisResult.slop?.repetitionRisk?.toUpperCase() || 'LOW'}
                </span>
              </div>
              <div className="signal-item">
                <span className="signal-title">Output Bloat</span>
                <span className={`signal-val ${getRiskBadgeColor(analysisResult.slop?.outputBloat)}`}>
                  {analysisResult.slop?.outputBloat?.toUpperCase() || 'LOW'}
                </span>
              </div>
              <div className="signal-item">
                <span className="signal-title">Regeneration Risk</span>
                <span className={`signal-val ${getRiskBadgeColor(analysisResult.slop?.regenerationRisk)}`}>
                  {analysisResult.slop?.regenerationRisk?.toUpperCase() || 'LOW'}
                </span>
              </div>
            </div>

            <div className="slop-text-block">
              <div className="text-group">
                <span className="group-label">Reason</span>
                <p>{analysisResult.slop?.reason || 'No specific risks detected.'}</p>
              </div>
              <div className="text-group">
                <span className="group-label">Suggestion</span>
                <p className="suggestion-text">{analysisResult.slop?.suggestion || 'No changes needed.'}</p>
              </div>
            </div>
          </div>

          {/* 3. Optimized Prompt */}
          <div className="workspace-card prompt-opt-card full-width">
            <div className="card-header space-between">
              <div>
                <span className="card-tag">03 / PROMPT REFINEMENT</span>
                <h3>Optimized Prompt</h3>
              </div>
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

            <div className="optimized-box">
              <code>{analysisResult.optimizedPrompt}</code>
            </div>
          </div>

          {/* 4. Recommended Model */}
          <div className="workspace-card model-card">
            <div className="card-header">
              <span className="card-tag">04 / COMPUTE RIGHT-SIZING</span>
              <h3>Recommended Model</h3>
            </div>

            <div className="model-body">
              <div className="model-badge-row">
                <span className="model-name">{analysisResult.recommendedModel}</span>
              </div>
              <p className="model-reason">{analysisResult.reason}</p>
            </div>
          </div>

          {/* 5. Token Efficiency */}
          <div className="workspace-card token-card">
            <div className="card-header">
              <span className="card-tag">05 / TOKEN ARITHMETIC</span>
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
