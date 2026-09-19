importScripts("services/api.js");

var ENDPOINTS = {
  "analyze": "analyzeContent",
  "token-count": "countTokens",
  "score": "score",
  "impact": "impact"
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== "ECOROUTE_API") return false;

  var fnName = ENDPOINTS[message.endpoint];
  var fn = fnName ? EcoRouteApi[fnName] : null;
  if (!fn) {
    sendResponse({ ok: false, error: "Unknown endpoint: " + message.endpoint, kind: "server" });
    return false;
  }

  fn(message.body || {})
    .then(function (data) {
      sendResponse({ ok: true, data: data });
    })
    .catch(function (err) {
      sendResponse({
        ok: false,
        error: err && err.message ? err.message : String(err),
        kind: err && err.kind ? err.kind : "server"
      });
    });

  return true;
});