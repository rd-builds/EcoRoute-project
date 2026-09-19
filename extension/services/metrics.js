(function (global) {
  var TIERS = [
    { name: "qwen3:0.6b", tier: "nano" },
    { name: "mistral-7b-instruct", tier: "small" },
    { name: "llama3.1:70b", tier: "medium" },
    { name: "claude-3.5-sonnet", tier: "large" }
  ];

  function resolveTier(modelName) {
    var n = String(modelName || "").toLowerCase();
    for (var i = 0; i < TIERS.length; i++) {
      if (n.indexOf(TIERS[i].name.toLowerCase()) !== -1) return TIERS[i].tier;
    }
    return "small";
  }

  function estimateTokens(text) {
    var chars = String(text || "").replace(/\s+/g, "").length;
    return Math.max(1, Math.round(chars / 4));
  }

  function meaningfulReduction(original, optimized) {
    var before = estimateTokens(original);
    var after = estimateTokens(optimized);
    if (before < 8) return false;
    if (after >= before) return false;
    return (before - after) / before >= 0.06;
  }

  var CODE_SIGNALS = [
    "\\bdef ", "\\bclass ", "\\bfunction ", "\\breturn ", "\\bimport ",
    "\\bfrom ", "\\bconst ", "\\blet ", "\\bvar ", "\\bpublic ", "\\bprivate ",
    "\\bstatic ", "\\bvoid ", "\\bint ", "\\bstring ", "\\bSELECT ", "\\bINSERT ",
    "\\bCREATE ", "\\bUPDATE ", "\\bDROP ", "\\b#include", "console.log",
    "print\\(", "=>"
  ];

  function sniffCode(text) {
    var t = String(text || "");
    if (t.length < 12) return false;
    var hits = 0;
    for (var i = 0; i < CODE_SIGNALS.length; i++) {
      if (new RegExp(CODE_SIGNALS[i], "i").test(t)) hits++;
    }
    var braces = (t.match(/[{}]/g) || []).length;
    var semicolons = (t.match(/;/g) || []).length;
    var lines = t.split("\n").length;
    return hits >= 2 || braces >= 2 || (semicolons >= 1 && lines >= 2);
  }

  global.EcoRouteMetrics = {
    resolveTier: resolveTier,
    estimateTokens: estimateTokens,
    meaningfulReduction: meaningfulReduction,
    sniffCode: sniffCode
  };
})(globalThis);