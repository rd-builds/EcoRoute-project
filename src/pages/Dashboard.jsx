import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

// Reusable Metric / Result Subcomponents
function PromptEfficiencyCard({ data }) {
  const hasData = data && data.originalTokens !== undefined && data.optimizedTokens !== undefined;

  return (
    <div className="dash-card">
      <div>
        <div className="dash-card-header">
          <span className="dash-card-tag">PROMPT EFFICIENCY</span>
        </div>
        {hasData ? (
          <>
            <div className="dash-tokens-row">
              <span className="dash-token-num">{data.originalTokens}</span>
              <span className="dash-token-arrow">→</span>
              <span className="dash-token-num highlight">{data.optimizedTokens}</span>
            </div>
            <span className="dash-reduction-badge">{data.reductionPercentage}% reduction</span>
          </>
        ) : (
          <div className="dash-empty-state-text">No data yet</div>
        )}
      </div>
      <p className="dash-card-desc">
        {hasData
          ? 'Your prompt was simplified while preserving its intent.'
          : 'Analyze a prompt to measure efficiency.'}
      </p>
    </div>
  );
}

function TaskAnalysisCard({ data }) {
  const hasData = data && data.taskType && data.complexity;

  return (
    <div className="dash-card">
      <div>
        <div className="dash-card-header">
          <span className="dash-card-tag">TASK ANALYSIS</span>
        </div>
        <div className="dash-task-specs">
          <div className="dash-spec-item">
            <span className="dash-spec-lbl">Type</span>
            <span className={`dash-spec-val ${!hasData ? 'empty' : ''}`}>
              {hasData ? data.taskType : 'No data yet'}
            </span>
          </div>
          <div className="dash-spec-item">
            <span className="dash-spec-lbl">Complexity</span>
            <span className={`dash-spec-val ${!hasData ? 'empty' : ''}`}>
              {hasData ? data.complexity : 'No data yet'}
            </span>
          </div>
        </div>
      </div>
      <p className="dash-card-desc">
        {hasData
          ? 'EcoRoute classified the task based on your request.'
          : 'No task classified yet.'}
      </p>
    </div>
  );
}

function ModelRecommendationCard({ data }) {
  const hasData = data && data.recommendedModel;

  return (
    <div className="dash-card">
      <div>
        <div className="dash-card-header">
          <span className="dash-card-tag">MODEL RECOMMENDATION</span>
        </div>
        <div className="dash-model-wrap">
          <span className="dash-model-badge">Recommended</span>
          <div className={`dash-model-name ${!hasData ? 'empty' : ''}`}>
            {hasData ? data.recommendedModel : 'No recommendation yet'}
          </div>
          {hasData && (
            <div className="dash-tier-pill">
              <span className="dash-tier-dot"></span>
              Optimal Compute Tier
            </div>
          )}
        </div>
      </div>
      <p className="dash-card-desc">
        {hasData
          ? (data.modelReasoning || 'Selected based on task reasoning requirements.')
          : 'No recommendation available until a prompt is submitted.'}
      </p>
    </div>
  );
}

function GreenScoreCard({ data }) {
  const hasScore = data && typeof data.greenScore === 'number';
  const targetScore = hasScore ? data.greenScore : 0;
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!hasScore) {
      setAnimatedScore(0);
      return;
    }

    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(easeProgress * targetScore);
      setAnimatedScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [hasScore, targetScore]);

  const strokeDashoffset = hasScore
    ? circumference - (circumference * animatedScore) / 100
    : circumference;

  const energyVal = data?.impact?.energy || 'No data yet';
  const carbonVal = data?.impact?.carbon || 'No data yet';
  const waterVal = data?.impact?.water || 'No data yet';

  return (
    <div className="dash-card">
      <div>
        <div className="dash-card-header">
          <span className="dash-card-tag">GREEN SCORE</span>
        </div>
        <div className="dash-score-body">
          <div className="dash-score-circle">
            <svg viewBox="0 0 76 76">
              <circle
                cx="38"
                cy="38"
                r={radius}
                className="dash-score-bg-ring"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="38"
                cy="38"
                r={radius}
                className="dash-score-prog-ring"
                strokeWidth="5"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="dash-score-text-val">
              <span className={`dash-score-int ${!hasScore ? 'empty' : ''}`}>
                {hasScore ? animatedScore : '—'}
              </span>
              <span className="dash-score-total">/100</span>
            </div>
          </div>
          <div className="dash-score-meta">
            <span className={`dash-score-status ${!hasScore ? 'empty' : ''}`}>
              {hasScore ? (data.efficiencyRating || 'Calculated score') : 'No score yet'}
            </span>
          </div>
        </div>
      </div>
      <div className="dash-impact-mini">
        <span className="dash-impact-title">Estimated Impact</span>
        <div className="dash-impact-row">
          <span>Energy</span>
          <span className={energyVal === 'No data yet' ? 'empty' : ''}>{energyVal}</span>
        </div>
        <div className="dash-impact-row">
          <span>Carbon</span>
          <span className={carbonVal === 'No data yet' ? 'empty' : ''}>{carbonVal}</span>
        </div>
        <div className="dash-impact-row">
          <span>Water</span>
          <span className={waterVal === 'No data yet' ? 'empty' : ''}>{waterVal}</span>
        </div>
      </div>
    </div>
  );
}

function AnalysisSummarySection({ data }) {
  const hasEfficiency = data && data.originalTokens !== undefined && data.optimizedTokens !== undefined;
  const hasTask = data && data.taskType;
  const hasComplexity = data && data.complexity;
  const hasModel = data && data.recommendedModel;
  const hasScore = data && typeof data.greenScore === 'number';
  const hasImpact = data && data.impact && data.impact.energy;

  return (
    <section className="dash-summary-section">
      <h3 className="dash-summary-header">Analysis Summary</h3>
      <div className="dash-summary-grid">
        <div className="dash-summary-item">
          <span className="dash-summary-label">Prompt Efficiency</span>
          {hasEfficiency ? (
            <span className="dash-summary-value highlight">
              {data.originalTokens} → {data.optimizedTokens} tokens ({data.reductionPercentage}% reduction)
            </span>
          ) : (
            <span className="dash-summary-value empty">No data yet</span>
          )}
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Task</span>
          <span className={`dash-summary-value ${!hasTask ? 'empty' : ''}`}>
            {hasTask ? data.taskType : 'No data yet'}
          </span>
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Complexity</span>
          <span className={`dash-summary-value ${!hasComplexity ? 'empty' : ''}`}>
            {hasComplexity ? data.complexity : 'No data yet'}
          </span>
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Recommended Model</span>
          <span className={`dash-summary-value ${hasModel ? 'highlight' : 'empty'}`}>
            {hasModel ? data.recommendedModel : 'No data yet'}
          </span>
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Green Score</span>
          <span className={`dash-summary-value ${hasScore ? 'highlight' : 'empty'}`}>
            {hasScore ? `${data.greenScore}/100` : 'No data yet'}
          </span>
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Estimated Resource Impact</span>
          <span className={`dash-summary-value ${!hasImpact ? 'empty' : ''}`}>
            {hasImpact
              ? `Energy: ${data.impact.energy} • Carbon: ${data.impact.carbon} • Water: ${data.impact.water}`
              : 'No data yet'}
          </span>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { analysisData } = useAuth();

  // Ensure view starts from top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="dash-page">
      <div className="dash-container">
        
        {/* Page Header */}
        <header className="dash-header" style={{ position: 'static', padding: 0, background: 'transparent' }}>
          <div className="dash-tag">
            <span className="tag-dot"></span>
            ECOROUTE DASHBOARD
          </div>
          <h1>Your AI efficiency at a glance</h1>
          <p>
            See how your prompts are being improved, what AI model is recommended, and how efficiently your requests are using resources.
          </p>
        </header>

        {/* 4 Primary Results Cards */}
        <div className="dash-results-grid">
          <PromptEfficiencyCard data={analysisData} />
          <TaskAnalysisCard data={analysisData} />
          <ModelRecommendationCard data={analysisData} />
          <GreenScoreCard data={analysisData} />
        </div>

        {/* Compact Analysis Summary Breakdown */}
        <AnalysisSummarySection data={analysisData} />

      </div>
    </div>
  );
}
