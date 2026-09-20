(function () {
  if (window.__ECOROUTE_CONTENT_LOADED__) return;
  window.__ECOROUTE_CONTENT_LOADED__ = true;

  var BUTTON_ID = "ecoroute-optimize-btn";
  var button = null;

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

  function getCapturedPrompt() {
    var selection = (window.getSelection ? window.getSelection().toString() : "").trim();
    if (selection.length > 0) {
      return selection;
    }
    var input = ChatGPTAdapter.findPromptInput();
    return (ChatGPTAdapter.getPrompt(input) || "").trim();
  }

  function refreshButtonVisibility() {
    if (!button) return;
    var prompt = getCapturedPrompt();
    if (prompt.length > 0) {
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

  async function onOptimizeClick() {
    var prompt = getCapturedPrompt();
    if (!prompt) return;

    EcoRoutePanel.open();
    EcoRoutePanel.setLoading();
    try {
      var result = await EcoRouteApi.callBackend("analyze", { prompt: prompt });
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