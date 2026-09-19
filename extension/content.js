(function () {
  if (window.__ECOROUTE_CONTENT_LOADED__) return;
  window.__ECOROUTE_CONTENT_LOADED__ = true;

  var BUTTON_ID = "ecoroute-optimize-btn";
  var button = null;

  function shouldApplyTextFallback(prompt, result) {
    if (result && result.taskType === "coding") return false;
    if (EcoRouteMetrics.sniffCode(prompt)) return false;
    if (EcoRouteMetrics.estimateTokens(prompt) < 8) return false;
    if (EcoRouteMetrics.meaningfulReduction(prompt, (result && result.optimizedPrompt) || "")) {
      return false;
    }
    return true;
  }

  function createButton() {
    var btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.type = "button";
    btn.className = "ecoroute-optimize-btn";
    btn.textContent = "🌱 Optimize";
    btn.title = "Optimize the current prompt with EcoRoute";
    btn.addEventListener("click", onOptimizeClick);
    return btn;
  }

  function getButton() {
    if (!button) {
      button = createButton();
      button.classList.add("ecoroute-hidden");
      document.body.appendChild(button);
    }
    return button;
  }

  function refreshButtonVisibility() {
    if (!button) return;
    var input = ChatGPTAdapter.findPromptInput();
    if (!input) {
      button.classList.add("ecoroute-hidden");
      return;
    }
    if (ChatGPTAdapter.hasPrompt(input)) {
      button.classList.remove("ecoroute-hidden");
    } else {
      button.classList.add("ecoroute-hidden");
    }
  }

  function placeButton() {
    var btn = getButton();
    var input = ChatGPTAdapter.findPromptInput();
    if (!input) {
      btn.classList.add("ecoroute-hidden");
      return;
    }
    var rect = input.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      btn.classList.add("ecoroute-hidden");
      return;
    }
    btn.style.left = Math.max(8, rect.right - 118) + "px";
    btn.style.top = Math.max(8, rect.top - 44) + "px";
    refreshButtonVisibility();
  }

  function shouldApplyTextFallback(prompt, result) {
    if (result && result.taskType === "coding") return false;
    if (sniffCode(prompt)) return false;
    if (EcoRouteMetrics.estimateTokens(prompt) < 8) return false;
    if (EcoRouteMetrics.meaningfulReduction(prompt, (result && result.optimizedPrompt) || "")) {
      return false;
    }
    return true;
  }

  function buildScoreRequest(tokens, result, tier) {
    var slop = (result && result.slop) || {};
    return {
      tokenReductionPercentage: tokens.tokenReductionPercentage,
      modelTier: tier,
      complexity: (result && result.complexity) || "medium",
      slopRisk: slop.risk,
      repetitionRisk: slop.repetitionRisk,
      outputBloat: slop.outputBloat,
      regenerationRisk: slop.regenerationRisk
    };
  }

  function buildImpactRequest(tokens, result, tier) {
    var slop = (result && result.slop) || {};
    return {
      modelTier: tier,
      complexity: (result && result.complexity) || "medium",
      estimatedTokens: tokens.tokensAfter,
      outputBloat: slop.outputBloat,
      repetitionRisk: slop.repetitionRisk
    };
  }

  async function applyTextFallback(prompt, result) {
    var optimized = EcoRouteTextOptimizer.optimizeText(prompt);
    if (!optimized.changed || !optimized.text) return result;
    if (optimized.text === ((result && result.optimizedPrompt) || "")) return result;
    if (!EcoRouteMetrics.meaningfulReduction(prompt, optimized.text)) return result;

    var tier = EcoRouteMetrics.resolveTier(result && result.recommendedModel);
    try {
      var tokens = await EcoRouteApi.callBackend("token-count", {
        originalPrompt: prompt,
        optimizedPrompt: optimized.text
      });
      if (!tokens || !tokens.tokenReduction || tokens.tokenReduction <= 0) return result;

      var score = await EcoRouteApi.callBackend("score", buildScoreRequest(tokens, result, tier));
      var impact = await EcoRouteApi.callBackend("impact", buildImpactRequest(tokens, result, tier));

      return Object.assign({}, result, {
        optimizedPrompt: optimized.text,
        tokensBefore: tokens.tokensBefore,
        tokensAfter: tokens.tokensAfter,
        tokenReduction: tokens.tokenReduction,
        tokenReductionPercentage: tokens.tokenReductionPercentage,
        greenScore: score ? score.greenScore : result.greenScore,
        impact: impact || result.impact
      });
    } catch (err) {
      return result;
    }
  }

  async function onOptimizeClick() {
    var input = ChatGPTAdapter.findPromptInput();
    var prompt = ChatGPTAdapter.getPrompt(input);
    if (!prompt.trim()) return;

    EcoRoutePanel.open();
    EcoRoutePanel.setLoading();
    try {
      var result = await EcoRouteApi.callBackend("analyze", { prompt: prompt });
      if (shouldApplyTextFallback(prompt, result)) {
        result = await applyTextFallback(prompt, result);
      }
      EcoRoutePanel.render(result, prompt);
    } catch (err) {
      EcoRoutePanel.renderError(err && err.message ? err.message : "Analysis failed.", {
        onRetry: function () { onOptimizeClick(); }
      });
    }
  }

  function startWatcher() {
    var observer = new MutationObserver(function () { placeButton(); });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  }

  function startLoop() {
    placeButton();
    setTimeout(startLoop, 600);
  }

  function init() {
    EcoRoutePanel.init({
      onClose: function () {}
    });
    startWatcher();
    startLoop();

    var tickingScroll = false;
    window.addEventListener("scroll", function () {
      if (tickingScroll) return;
      tickingScroll = true;
      requestAnimationFrame(function () {
        placeButton();
        tickingScroll = false;
      });
    }, { passive: true });

    window.addEventListener("resize", function () { placeButton(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();