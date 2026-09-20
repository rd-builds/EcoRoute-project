(function (global) {
var API_BASE = "https://ecoroute-project-1.onrender.com";
  var TIMEOUT_MS = 120000;

  function makeError(message, kind) {
    var err = new Error(message);
    err.kind = kind;
    return err;
  }

  async function request(path, body) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    var response;
    try {
      response = await fetch(API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
        signal: controller.signal
      });
    } catch (err) {
      if (err && err.name === "AbortError") {
        throw makeError("The backend took too long to respond. Please try again.", "timeout");
      }
      throw makeError(
        "Backend unavailable. Make sure the FastAPI server is running at " + API_BASE + ".",
        "network"
      );
    } finally {
      clearTimeout(timer);
    }

    var data = null;
    try {
      data = await response.json();
    } catch (_err) {
      data = null;
    }

    if (!response.ok) {
      var detail = data != null ? (data.detail || data.message) : null;
      if (detail !== undefined && detail !== null && detail !== "") {
        throw makeError(
          typeof detail === "string" ? detail : JSON.stringify(detail),
          "server"
        );
      }
      throw makeError("Backend returned HTTP " + response.status + ".", "server");
    }

    return data;
  }

  function callBackend(endpoint, body) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.runtime.sendMessage(
          { type: "ECOROUTE_API", endpoint: endpoint, body: body || {} },
          function (response) {
            if (chrome.runtime.lastError) {
              reject(makeError(chrome.runtime.lastError.message, "internal"));
              return;
            }
            if (!response) {
              reject(makeError("No response from EcoRoute background.", "internal"));
              return;
            }
            if (!response.ok) {
              reject(makeError(
                response.error || "EcoRoute request failed.",
                response.kind || "server"
              ));
              return;
            }
            resolve(response.data);
          }
        );
      } catch (err) {
        reject(makeError("Unable to reach EcoRoute background.", "internal"));
      }
    });
  }

  global.EcoRouteApi = {
    analyzeContent: function (prompt) {
      return request("/api/analyze", { prompt: prompt });
    },
    countTokens: function (body) {
      return request("/api/token-count", body);
    },
    score: function (body) {
      return request("/api/score", body);
    },
    impact: function (body) {
      return request("/api/impact", body);
    },
    callBackend: callBackend
  };
})(globalThis);