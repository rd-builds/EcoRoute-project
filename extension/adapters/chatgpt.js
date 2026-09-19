(function (global) {
  var EDITOR_SELECTOR = "#prompt-textarea";

  function findPromptInput() {
    var editor = document.querySelector(EDITOR_SELECTOR);
    if (editor) return editor;

    var lexical = document.querySelector('div[contenteditable="true"][data-lexical-editor]');
    if (lexical) return lexical;

    var proseMirror = document.querySelector(".ProseMirror");
    if (proseMirror) return proseMirror;

    var fallbackEditable = document.querySelector(
      'div[contenteditable="true"][role="textbox"], div[contenteditable="true"][id*="prompt"]'
    );
    if (fallbackEditable) return fallbackEditable;

    var textarea = document.querySelector("textarea, input[type='text']");
    return textarea || null;
  }

  function getPrompt(input) {
    var el = input || findPromptInput();
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      return el.value || "";
    }
    return (el.innerText || el.textContent || "");
  }

  function setPrompt(input, text) {
    var el = input || findPromptInput();
    if (!el) return false;
    var value = typeof text === "string" ? text : "";

    el.focus();

    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    try {
      document.execCommand("selectAll");
      document.execCommand("insertText", false, value);
    } catch (_err) {
      el.innerText = value;
      el.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: value
      }));
    }

    var inserted = (el.innerText || "").replace(/\s+/g, " ").trim();
    var expected = value.replace(/\s+/g, " ").trim();
    if (inserted !== expected) {
      el.focus();
      el.innerText = value;
      el.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: value
      }));
    }
    return true;
  }

  function hasPrompt(input) {
    return getPrompt(input).trim().length > 0;
  }

  global.ChatGPTAdapter = {
    findPromptInput: findPromptInput,
    getPrompt: getPrompt,
    setPrompt: setPrompt,
    hasPrompt: hasPrompt
  };
})(globalThis);