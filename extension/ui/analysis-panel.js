(function (global) {
  var PANEL_ID = "ecoroute-panel";
  var BODY_ID = "ecoroute-body";
  var CLASS_OPEN = "ecoroute-panel--open";

  var panelEl = null;
  var bodyEl = null;
  var onCloseHandler = null;

  function h(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function txt(str) {
    return document.createTextNode(String(str));
  }

  function label(value, fallback) {
    if (value === undefined || value === null || value === "") {
      return fallback || "—";
    }
    return String(value);
  }

  function buildShell() {
    var panel = h("div");
    panel.id = PANEL_ID;
    panel.className = "ecoroute-panel";
    panel.setAttribute("hidden", "");

    var header = h("div", "ecoroute-header");
    var brand = h("span", "ecoroute-brand");
    brand.appendChild(txt("🌱 EcoRoute"));
    var closeBtn = h("button", "ecoroute-close");
    closeBtn.type = "button";
    closeBtn.title = "Close";
    closeBtn.textContent = "✕";
    header.appendChild(brand);
    header.appendChild(closeBtn);

    bodyEl = h("div");
    bodyEl.id = BODY_ID;
    bodyEl.className = "ecoroute-body";

    panel.appendChild(header);
    panel.appendChild(bodyEl);
    document.body.appendChild(panel);

    closeBtn.addEventListener("click", function () { close(); });
    return panel;
  }

  function init(opts) {
    if (panelEl) return panelEl;
    onCloseHandler = opts && typeof opts.onClose === "function" ? opts.onClose : null;
    panelEl = buildShell();
    return panelEl;
  }

  function open() {
    if (!panelEl) return;
    panelEl.removeAttribute("hidden");
    panelEl.classList.add(CLASS_OPEN);
  }

  function close() {
    if (!panelEl) return;
    panelEl.setAttribute("hidden", "");
    panelEl.classList.remove(CLASS_OPEN);
    if (onCloseHandler) onCloseHandler();
  }

  function setLoading() {
    if (!panelEl) return;
    bodyEl.innerHTML = "";
    var wrap = h("div", "ecoroute-status");
    var spinner = h("div", "ecoroute-spinner");
    var msg = h("p", "ecoroute-status-text");
    msg.appendChild(txt("Analyzing your prompt with the EcoRoute backend…"));
    wrap.appendChild(spinner);
    wrap.appendChild(msg);
    bodyEl.appendChild(wrap);
    open();
  }

  function metaRow(k, v) {
    var row = h("div", "ecoroute-meta-row");
    var key = h("span", "ecoroute-meta-key");
    key.appendChild(txt(k));
    var val = h("span", "ecoroute-meta-val");
    val.appendChild(txt(label(v)));
    row.appendChild(key);
    row.appendChild(val);
    return row;
  }

  function stat(k, v) {
    var box = h("div", "ecoroute-stat");
    var num = h("div", "ecoroute-stat-num");
    num.appendChild(txt(label(v, "0")));
    var lbl = h("div", "ecoroute-stat-label");
    lbl.appendChild(txt(k));
    box.appendChild(num);
    box.appendChild(lbl);
    return box;
  }

  function miniStat(k, v) {
    var box = h("div", "ecoroute-mini-stat");
    var num = h("div", "ecoroute-mini-stat-num");
    num.appendChild(txt(label(v)));
    var lbl = h("div", "ecoroute-mini-stat-label");
    lbl.appendChild(txt(k));
    box.appendChild(num);
    box.appendChild(lbl);
    return box;
  }

  function chip(k, v) {
    var c = h("div", "ecoroute-chip");
    var key = h("span", "ecoroute-chip-key");
    key.appendChild(txt(k));
    var val = h("span", "ecoroute-chip-val");
    val.appendChild(txt(label(v)));
    c.appendChild(key);
    c.appendChild(val);
    return c;
  }

  function paragraph(title, text) {
    var p = h("p", "ecoroute-paragraph");
    if (title) {
      var strong = h("strong");
      strong.appendChild(txt(label(title)));
      p.appendChild(strong);
      p.appendChild(txt(" "));
    }
    p.appendChild(txt(label(text)));
    return p;
  }

  function sectionTitle(text) {
    var div = h("div", "ecoroute-section-title");
    div.appendChild(txt(text));
    return div;
  }

  function codeDetails(title, text, isOpen) {
    var details = h("details");
    if (isOpen) details.open = true;
    details.className = "ecoroute-details";

    var summary = h("summary");
    summary.appendChild(txt(title));
    details.appendChild(summary);

    var pre = h("pre", "ecoroute-code");
    var code = h("code");
    code.appendChild(txt(label(text)));
    pre.appendChild(code);
    details.appendChild(pre);
    return details;
  }

function fmtPct(v) {
    var n = Number(v);
    if (!isFinite(n)) return "—";
    return n.toFixed(1) + "%";
  }

  function copyText(text) {
    var value = String(text || "");
    if (!value) return false;

    var ta = h("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (_err) {
      ok = false;
    }
    document.body.removeChild(ta);

    if (!ok && global.navigator && global.navigator.clipboard) {
      global.navigator.clipboard.writeText(value).catch(function () {});
      ok = true;
    }
    return ok;
  }

  function replacePrompt(text) {
    try {
      return global.ChatGPTAdapter.setPrompt(global.ChatGPTAdapter.findPromptInput(), text);
    } catch (_err) {
      return false;
    }
  }

  function flashFeedback(btn, msg) {
    var original = btn.textContent;
    btn.textContent = msg;
    btn.classList.add("ecoroute-btn--flash");
    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove("ecoroute-btn--flash");
    }, 1500);
  }

  function render(result, originalPrompt) {
    if (!panelEl) return;
    var r = result || {};
    var slop = r.slop || {};
    var impact = r.impact || {};
    bodyEl.innerHTML = "";

    var scoreCard = h("div", "ecoroute-scorecard");
    var scoreBox = h("div", "ecoroute-score-box");
    var scoreNum = h("div", "ecoroute-score-num");
    scoreNum.appendChild(txt(label(Math.round(Number(r.greenScore || 0)), "0")));
    var scoreLabel = h("div", "ecoroute-score-label");
    scoreLabel.appendChild(txt("Green Score"));
    scoreBox.appendChild(scoreNum);
    scoreBox.appendChild(scoreLabel);

    var meta = h("div", "ecoroute-meta");
    meta.appendChild(metaRow("Content type", r.taskType));
    meta.appendChild(metaRow("Complexity", r.complexity));
    var necessityVal = r.aiNecessity && typeof r.aiNecessity === "object" ? r.aiNecessity.status : r.aiNecessity;
    meta.appendChild(metaRow("AI necessity", necessityVal));
    meta.appendChild(metaRow("Recommended model", r.recommendedModel));

    scoreCard.appendChild(scoreBox);
    scoreCard.appendChild(meta);
    bodyEl.appendChild(scoreCard);

    var tokens = h("div", "ecoroute-tokens");
    tokens.appendChild(stat("Before", r.tokensBefore));
    tokens.appendChild(stat("After", r.tokensAfter));
    tokens.appendChild(stat("Saved", r.tokenReduction));
    tokens.appendChild(stat("Reduction", fmtPct(r.tokenReductionPercentage)));
    bodyEl.appendChild(tokens);

    var impactBlock = h("div", "ecoroute-impact");
    impactBlock.appendChild(chip("Energy", impact.energy));
    impactBlock.appendChild(chip("Water", impact.water));
    impactBlock.appendChild(chip("Carbon", impact.carbon));
    bodyEl.appendChild(impactBlock);

    if (slop.risk) {
      var slopBlock = h("div", "ecoroute-card");
      slopBlock.appendChild(sectionTitle("Output risk"));
      var riskLine = h("div", "ecoroute-risk");
      riskLine.appendChild(txt("Slop: "));
      var riskStrong = h("strong");
      riskStrong.appendChild(txt(label(slop.risk)));
      riskLine.appendChild(riskStrong);
      slopBlock.appendChild(riskLine);
      var grid = h("div", "ecoroute-risk-grid");
      grid.appendChild(miniStat("Repetition", slop.repetitionRisk));
      grid.appendChild(miniStat("Output bloat", slop.outputBloat));
      grid.appendChild(miniStat("Regeneration", slop.regenerationRisk));
      slopBlock.appendChild(grid);
      if (slop.reason) slopBlock.appendChild(paragraph("Reason", slop.reason));
      if (slop.suggestion) slopBlock.appendChild(paragraph("Suggestion", slop.suggestion));
      bodyEl.appendChild(slopBlock);
    }

    if (r.reason) {
      var rec = h("div", "ecoroute-card");
      rec.appendChild(sectionTitle("Recommendation"));
      rec.appendChild(paragraph("", r.reason));
      bodyEl.appendChild(rec);
    }

    var comparison = h("div", "ecoroute-card");
    comparison.appendChild(sectionTitle("Comparison"));
    comparison.appendChild(codeDetails("Optimized prompt", r.optimizedPrompt, true));
    comparison.appendChild(codeDetails("Original prompt", originalPrompt, false));
    bodyEl.appendChild(comparison);

    var footer = h("div", "ecoroute-actions");
    var copyBtn = h("button", "ecoroute-btn ecoroute-btn--primary");
    copyBtn.type = "button";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", function () {
      var ok = copyText(r.optimizedPrompt);
      flashFeedback(copyBtn, ok ? "Copied" : "Copy failed");
    });

    var replaceBtn = h("button", "ecoroute-btn ecoroute-btn--secondary");
    replaceBtn.type = "button";
    replaceBtn.textContent = "Replace Prompt";
    replaceBtn.addEventListener("click", function () {
      var ok = replacePrompt(r.optimizedPrompt);
      flashFeedback(replaceBtn, ok ? "Replaced in input" : "Input not found");
    });

    footer.appendChild(copyBtn);
    footer.appendChild(replaceBtn);
    bodyEl.appendChild(footer);

    bodyEl.scrollTop = 0;
    open();
  }

  function renderError(message, opts) {
    if (!panelEl) return;
    bodyEl.innerHTML = "";
    var wrap = h("div", "ecoroute-error");
    var title = h("div", "ecoroute-error-title");
    title.appendChild(txt("EcoRoute could not optimize"));
    var msg = h("p", "ecoroute-error-msg");
    msg.appendChild(txt(label(message)));
    wrap.appendChild(title);
    wrap.appendChild(msg);
    var hint = h("p", "ecoroute-error-hint");
    hint.appendChild(txt("Ensure the FastAPI backend (and Ollama, if required) is running, then try again."));
    wrap.appendChild(hint);
    if (opts && typeof opts.onRetry === "function") {
      var retry = h("button", "ecoroute-btn ecoroute-btn--primary");
      retry.type = "button";
      retry.textContent = "Retry";
      retry.addEventListener("click", opts.onRetry);
      wrap.appendChild(retry);
    }
    bodyEl.appendChild(wrap);
    open();
  }

  global.EcoRoutePanel = {
    init: init,
    open: open,
    close: close,
    setLoading: setLoading,
    render: render,
    renderError: renderError
  };
})(globalThis);