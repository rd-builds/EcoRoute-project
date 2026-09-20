import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EcoRouteAtmosphere from '../components/EcoRouteAtmosphere';
import './Dashboard.css';

// Reusable Metric / Result Subcomponents for Aggregated Data

function PromptEfficiencyCard({ hasData, totalPrompts, avgTokensBefore, avgTokensAfter, avgTokenReduction, avgReductionPercentage }) {
  return (
    <div className="dash-card">
      <div>
        <div className="dash-card-header">
          <span className="dash-card-tag">AVERAGE PROMPT EFFICIENCY</span>
        </div>
        {hasData ? (
          <>
            <div className="dash-tokens-row">
              <span className="dash-token-num">{avgTokensBefore}</span>
              <span className="dash-token-arrow">→</span>
              <span className="dash-token-num highlight">{avgTokensAfter}</span>
            </div>
            <span className="dash-reduction-badge">
              {avgReductionPercentage > 0 ? `+${avgReductionPercentage}%` : `${avgReductionPercentage}%`} avg reduction
            </span>
          </>
        ) : (
          <div className="dash-empty-state-text">No prompt history</div>
        )}
      </div>
      <p className="dash-card-desc">
        {hasData
          ? `Calculated from ${totalPrompts} prompt analysis ${totalPrompts === 1 ? 'record' : 'records'} (${avgTokenReduction} avg tokens saved).`
          : 'Analyze prompts in AI Workspace to measure average efficiency.'}
      </p>
    </div>
  );
}

function TaskAnalysisCard({ hasData, totalPrompts, mostCommonTaskType, taskPercentage, primaryComplexity }) {
  return (
    <div className="dash-card">
      <div>
        <div className="dash-card-header">
          <span className="dash-card-tag">TASK & COMPLEXITY PATTERN</span>
        </div>
        <div className="dash-task-specs">
          <div className="dash-spec-item">
            <span className="dash-spec-lbl">Most Common Task</span>
            <span className={`dash-spec-val ${!hasData ? 'empty' : ''}`}>
              {hasData ? mostCommonTaskType : 'No data yet'}
            </span>
          </div>
          <div className="dash-spec-item">
            <span className="dash-spec-lbl">Primary Complexity</span>
            <span className={`dash-spec-val ${!hasData ? 'empty' : ''}`}>
              {hasData ? primaryComplexity : 'No data yet'}
            </span>
          </div>
        </div>
      </div>
      <p className="dash-card-desc">
        {hasData
          ? `${mostCommonTaskType} represents ${taskPercentage}% of your ${totalPrompts} analyzed requests.`
          : 'No tasks analyzed yet.'}
      </p>
    </div>
  );
}

function ModelRecommendationCard({ hasData, totalPrompts, mostRecommendedModel, maxModelCount, modelPercentage }) {
  return (
    <div className="dash-card">
      <div>
        <div className="dash-card-header">
          <span className="dash-card-tag">MOST RECOMMENDED MODEL</span>
        </div>
        <div className="dash-model-wrap">
          <span className="dash-model-badge">Top Recommendation</span>
          <div className={`dash-model-name ${!hasData ? 'empty' : ''}`}>
            {hasData ? mostRecommendedModel : 'No recommendation yet'}
          </div>
          {hasData && (
            <div className="dash-tier-pill">
              <span className="dash-tier-dot"></span>
              {maxModelCount} of {totalPrompts} prompts ({modelPercentage}%)
            </div>
          )}
        </div>
      </div>
      <p className="dash-card-desc">
        {hasData
          ? `Most frequently selected compute tier across your overall prompt history.`
          : 'No recommendation available until a prompt is submitted.'}
      </p>
    </div>
  );
}

function GreenScoreCard({ hasData, avgGreenScore, avgEnergy, avgCarbon, avgWater, efficiencyRating }) {
  const targetScore = hasData ? avgGreenScore : 0;
  const [animatedScore, setAnimatedScore] = useState(targetScore);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!hasData) return;

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

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [hasData, targetScore]);

  const strokeDashoffset = hasData
    ? circumference - (circumference * animatedScore) / 100
    : circumference;

  return (
    <div className="dash-card">
      <div>
        <div className="dash-card-header">
          <span className="dash-card-tag">AVERAGE GREEN SCORE</span>
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
              <span className={`dash-score-int ${!hasData ? 'empty' : ''}`}>
                {hasData ? animatedScore : '—'}
              </span>
              <span className="dash-score-total">/100</span>
            </div>
          </div>
          <div className="dash-score-meta">
            <span className={`dash-score-status ${!hasData ? 'empty' : ''}`}>
              {hasData ? efficiencyRating : 'No score yet'}
            </span>
          </div>
        </div>
      </div>
      <div className="dash-impact-mini">
        <span className="dash-impact-title">Average Estimated Impact</span>
        <div className="dash-impact-row">
          <span>Energy</span>
          <span className={!hasData ? 'empty' : ''}>{hasData ? avgEnergy : 'No data yet'}</span>
        </div>
        <div className="dash-impact-row">
          <span>Carbon</span>
          <span className={!hasData ? 'empty' : ''}>{hasData ? avgCarbon : 'No data yet'}</span>
        </div>
        <div className="dash-impact-row">
          <span>Water</span>
          <span className={!hasData ? 'empty' : ''}>{hasData ? avgWater : 'No data yet'}</span>
        </div>
      </div>
    </div>
  );
}

function AnalysisSummarySection({
  hasData,
  totalPrompts,
  avgTokensBefore,
  avgTokensAfter,
  avgReductionPercentage,
  mostCommonTaskType,
  primaryComplexity,
  mostRecommendedModel,
  avgGreenScore,
  avgEnergy,
  avgCarbon,
  avgWater,
  efficiencyRating
}) {
  return (
    <section className="dash-summary-section">
      <div className="dash-summary-header-row">
        <h3 className="dash-summary-header">Aggregate Usage Summary ({totalPrompts} {totalPrompts === 1 ? 'Prompt' : 'Prompts'})</h3>
      </div>

      <div className="dash-summary-grid">
        <div className="dash-summary-item">
          <span className="dash-summary-label">Total Prompts Analyzed</span>
          <span className={`dash-summary-value ${hasData ? 'highlight' : 'empty'}`}>
            {hasData ? `${totalPrompts} prompts analyzed` : '0 prompts'}
          </span>
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Average Prompt Efficiency</span>
          {hasData ? (
            <span className="dash-summary-value highlight">
              {avgTokensBefore} → {avgTokensAfter} avg tokens ({avgReductionPercentage}% reduction)
            </span>
          ) : (
            <span className="dash-summary-value empty">No data yet</span>
          )}
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Most Common Task</span>
          <span className={`dash-summary-value ${!hasData ? 'empty' : ''}`}>
            {hasData ? mostCommonTaskType : 'No data yet'}
          </span>
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Primary Complexity</span>
          <span className={`dash-summary-value ${!hasData ? 'empty' : ''}`}>
            {hasData ? primaryComplexity : 'No data yet'}
          </span>
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Most Recommended Model</span>
          <span className={`dash-summary-value ${hasData ? 'highlight' : 'empty'}`}>
            {hasData ? mostRecommendedModel : 'No data yet'}
          </span>
        </div>
        <div className="dash-summary-item">
          <span className="dash-summary-label">Average Green Score</span>
          <span className={`dash-summary-value ${hasData ? 'highlight' : 'empty'}`}>
            {hasData ? `${avgGreenScore}/100 (${efficiencyRating})` : 'No data yet'}
          </span>
        </div>
        <div className="dash-summary-item full-span">
          <span className="dash-summary-label">Average Estimated Resource Impact</span>
          <span className={`dash-summary-value ${!hasData ? 'empty' : ''}`}>
            {hasData
              ? `Energy: ${avgEnergy} • Carbon: ${avgCarbon} • Water: ${avgWater}`
              : 'No data yet'}
          </span>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { analysisHistory, clearAnalysis } = useAuth();
  const history = analysisHistory || [];
  const totalPrompts = history.length;
  const hasData = totalPrompts > 0;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Compute Dynamic Aggregate Metrics across ALL stored analysis records
  let avgGreenScore = 0;
  let avgTokensBefore = 0;
  let avgTokensAfter = 0;
  let avgTokenReduction = 0;
  let avgReductionPercentage = 0;
  let mostRecommendedModel = 'None';
  let maxModelCount = 0;
  let modelPercentage = 0;
  let mostCommonTaskType = 'None';
  let maxTaskCount = 0;
  let taskPercentage = 0;
  let primaryComplexity = 'Medium';
  let avgEnergy = 'Low';
  let avgCarbon = 'Low';
  let avgWater = 'Low';
  let efficiencyRating = 'No data';

  if (hasData) {
    // 1. Average Green Score
    const totalGreenScore = history.reduce((sum, item) => sum + (typeof item.greenScore === 'number' ? item.greenScore : 0), 0);
    avgGreenScore = Math.round(totalGreenScore / totalPrompts);
    efficiencyRating = avgGreenScore >= 80 ? 'Optimal Compute Tier' : avgGreenScore >= 50 ? 'Moderate Efficiency' : 'Low Efficiency';

    // 2. Average Token Arithmetic
    const totalBefore = history.reduce((sum, item) => sum + (item.tokensBefore ?? item.originalTokens ?? 0), 0);
    const totalAfter = history.reduce((sum, item) => sum + (item.tokensAfter ?? item.optimizedTokens ?? 0), 0);
    const totalReductionPct = history.reduce((sum, item) => sum + (item.tokenReductionPercentage ?? item.reductionPercentage ?? 0), 0);

    avgTokensBefore = Math.round(totalBefore / totalPrompts);
    avgTokensAfter = Math.round(totalAfter / totalPrompts);
    avgTokenReduction = Math.round((totalBefore - totalAfter) / totalPrompts);
    avgReductionPercentage = Math.round((totalReductionPct / totalPrompts) * 10) / 10;

    // 3. Most Recommended Model
    const modelCounts = {};
    history.forEach((item) => {
      const model = item.recommendedModel || 'Unknown Model';
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    });

    Object.entries(modelCounts).forEach(([model, count]) => {
      if (count > maxModelCount) {
        maxModelCount = count;
        mostRecommendedModel = model;
      }
    });
    modelPercentage = Math.round((maxModelCount / totalPrompts) * 100);

    // 4. Most Common Task Type
    const taskCounts = {};
    history.forEach((item) => {
      const t = item.taskType ? item.taskType.toLowerCase() : 'other';
      taskCounts[t] = (taskCounts[t] || 0) + 1;
    });

    Object.entries(taskCounts).forEach(([t, count]) => {
      if (count > maxTaskCount) {
        maxTaskCount = count;
        mostCommonTaskType = t.charAt(0).toUpperCase() + t.slice(1);
      }
    });
    taskPercentage = Math.round((maxTaskCount / totalPrompts) * 100);

    // 5. Primary Complexity
    const compCounts = { low: 0, medium: 0, high: 0 };
    history.forEach((item) => {
      const c = (item.complexity || 'medium').toLowerCase();
      if (compCounts[c] !== undefined) compCounts[c]++;
    });
    let maxComp = -1;
    Object.entries(compCounts).forEach(([c, count]) => {
      if (count > maxComp) {
        maxComp = count;
        primaryComplexity = c.charAt(0).toUpperCase() + c.slice(1);
      }
    });

    // 6. Aggregated Resource Demand
    const weightMap = { low: 1, medium: 2, high: 3 };
    const labelMap = { 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH' };

    const getAvgImpact = (resourceKey) => {
      let sum = 0;
      let count = 0;
      history.forEach((item) => {
        const val = item.impact?.[resourceKey] || item.impact?.[resourceKey.toLowerCase()];
        if (val && weightMap[val.toLowerCase()]) {
          sum += weightMap[val.toLowerCase()];
          count++;
        }
      });
      if (count === 0) return 'LOW';
      const avg = Math.round(sum / count);
      return labelMap[avg] || 'LOW';
    };

    avgEnergy = getAvgImpact('energy');
    avgCarbon = getAvgImpact('carbon');
    avgWater = getAvgImpact('water');
  }

  return (
    <div className="dash-page">
      <EcoRouteAtmosphere variant="dashboard" />
      <div className="dash-container">
        
        {/* Page Header */}
        <header className="dash-header" style={{ position: 'static', padding: 0, background: 'transparent' }}>
          <div className="dash-header-row">
            <div>
              <div className="dash-tag">
                <span className="tag-dot"></span>
                ECOROUTE DASHBOARD • OVERALL SESSION USAGE
              </div>
              <h1>Your overall AI efficiency profile</h1>
              <p>
                Aggregate metrics calculated dynamically from all prompt analyses saved in your session history.
              </p>
            </div>

            {hasData && (
              <div className="dash-header-stats">
                <div className="total-prompts-card">
                  <span className="total-prompts-num">{totalPrompts}</span>
                  <span className="total-prompts-label">Total Prompts Analyzed</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {!hasData ? (
          /* Empty State when 0 prompts analyzed */
          <div className="dash-empty-state-box">
            <div className="empty-icon-circle">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="1.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <h2>No Prompts Analyzed Yet</h2>
            <p>
              Your EcoRoute Dashboard aggregates metrics across every analyzed prompt. Head to the AI Workspace to analyze your first prompt and start building your performance history.
            </p>
            <Link to="/workspace" className="btn-solid btn-go-workspace">
              Analyze Prompts in AI Workspace
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        ) : (
          <>
            {/* 4 Primary Aggregate Results Cards */}
            <div className="dash-results-grid">
              <PromptEfficiencyCard
                hasData={hasData}
                totalPrompts={totalPrompts}
                avgTokensBefore={avgTokensBefore}
                avgTokensAfter={avgTokensAfter}
                avgTokenReduction={avgTokenReduction}
                avgReductionPercentage={avgReductionPercentage}
              />
              <TaskAnalysisCard
                hasData={hasData}
                totalPrompts={totalPrompts}
                mostCommonTaskType={mostCommonTaskType}
                taskPercentage={taskPercentage}
                primaryComplexity={primaryComplexity}
              />
              <ModelRecommendationCard
                hasData={hasData}
                totalPrompts={totalPrompts}
                mostRecommendedModel={mostRecommendedModel}
                maxModelCount={maxModelCount}
                modelPercentage={modelPercentage}
              />
              <GreenScoreCard
                hasData={hasData}
                avgGreenScore={avgGreenScore}
                avgEnergy={avgEnergy}
                avgCarbon={avgCarbon}
                avgWater={avgWater}
                efficiencyRating={efficiencyRating}
              />
            </div>

            {/* Compact Aggregate Analysis Summary Breakdown */}
            <AnalysisSummarySection
              hasData={hasData}
              totalPrompts={totalPrompts}
              avgTokensBefore={avgTokensBefore}
              avgTokensAfter={avgTokensAfter}
              avgReductionPercentage={avgReductionPercentage}
              mostCommonTaskType={mostCommonTaskType}
              primaryComplexity={primaryComplexity}
              mostRecommendedModel={mostRecommendedModel}
              avgGreenScore={avgGreenScore}
              avgEnergy={avgEnergy}
              avgCarbon={avgCarbon}
              avgWater={avgWater}
              efficiencyRating={efficiencyRating}
            />

            {/* Stored Analysis History List */}
            <section className="dash-history-section">
              <div className="dash-history-header">
                <div>
                  <h3>Analysis History ({totalPrompts})</h3>
                  <p>Detailed log of every prompt analyzed during your active session.</p>
                </div>
                {clearAnalysis && (
                  <button onClick={clearAnalysis} className="btn-clear-history">
                    Clear History
                  </button>
                )}
              </div>

              <div className="dash-history-list">
                {history.map((record, index) => {
                  const origTok = record.tokensBefore ?? record.originalTokens ?? 0;
                  const optTok = record.tokensAfter ?? record.optimizedTokens ?? 0;
                  const redPct = record.tokenReductionPercentage ?? record.reductionPercentage ?? 0;
                  const formattedDate = record.timestamp
                    ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : `Prompt #${history.length - index}`;

                  return (
                    <div key={record.id || index} className="dash-history-card">
                      <div className="history-card-top">
                        <div className="history-badges">
                          <span className="history-index-tag">#{history.length - index}</span>
                          <span className="history-task-tag">{record.taskType || 'Other'}</span>
                          <span className="history-time-tag">{formattedDate}</span>
                        </div>
                        <div className="history-score-badge">
                          Green Score: <strong>{record.greenScore || 85}/100</strong>
                        </div>
                      </div>

                      <div className="history-prompts-grid">
                        <div className="history-prompt-box">
                          <span className="prompt-box-label">Original Prompt ({origTok} tokens)</span>
                          <p className="prompt-box-text">{record.prompt}</p>
                        </div>
                        <div className="history-prompt-box opt">
                          <span className="prompt-box-label">Optimized Prompt ({optTok} tokens)</span>
                          <p className="prompt-box-text">{record.optimizedPrompt}</p>
                        </div>
                      </div>

                      <div className="history-card-footer">
                        <span className="footer-metric">
                          Efficiency: <strong>{redPct > 0 ? `+${redPct}%` : `${redPct}%`}</strong>
                        </span>
                        <span className="footer-metric">
                          Model: <strong>{record.recommendedModel || 'Default'}</strong>
                        </span>
                        <span className="footer-metric">
                          Complexity: <strong>{(record.complexity || 'medium').toUpperCase()}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

      </div>
    </div>
  );
}
