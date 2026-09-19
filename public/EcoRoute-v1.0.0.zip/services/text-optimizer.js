(function (global) {
  var FILLER_PHRASES = [
    "can you please", "can you kindly", "could you please", "could you kindly",
    "would you please", "would you kindly", "will you please",
    "i would like you to", "i would appreciate it if you",
    "i want you to", "i need you to", "i am asking you to",
    "i was wondering if", "i was hoping you", "i am hoping you",
    "i was hoping that", "i am hoping that",
    "just wanted to ask", "just wanted to know", "i would like to ask",
    "thank you in advance", "thanks in advance", "thank you so much",
    "thanks a lot", "thank you", "thanks", "kindly", "please",
    "hey", "hello", "hi there"
  ];

  var WORDY_REPLACEMENTS = [
    ["and also", "and"],
    ["but also", "but"],
    ["in order to", "to"],
    ["due to the fact that", "because"],
    ["at this point in time", "now"],
    ["at all times", "always"],
    ["right now", "now"],
    ["in the event that", "if"],
    ["for the purpose of", "for"],
    ["in the case of", "for"],
    ["a lot of", "many"],
    ["is able to", "can"],
    ["are able to", "can"],
    ["have the ability to", "can"],
    ["make sure that", "ensure"],
    ["it is important to note that", " "],
    ["the fact that", " "],
    ["in a very simple manner", "simply"],
    ["in a very simple way", "simply"],
    ["in simple terms", "simply"],
    ["in a manner that", "so that"],
    ["as a matter of fact", " "]
  ];

  var STOPWORDS = (
    "a an the and or but if so then than that this these those with without from for of to on in at by " +
    "between into onto over under above below out up down off about around through across along behind " +
    "before after during within upon toward towards your you youre yours my mine me i im we our us they " +
    "them their theirs he him his she her hers it its do does did done dont doesnt not no nor is are am " +
    "was were be been being have has had having will would should could can shall may might must very " +
    "really also just only even still too two etc"
  ).split(" ");

  var STOP_SET = {};
  for (var s = 0; s < STOPWORDS.length; s++) STOP_SET[STOPWORDS[s]] = true;

  var FILLER_WORDS = {};
  function indexPhraseWords(phrase) {
    var words = String(phrase).toLowerCase().split(/\s+/);
    for (var i = 0; i < words.length; i++) if (words[i]) FILLER_WORDS[words[i]] = true;
  }
  for (var f = 0; f < FILLER_PHRASES.length; f++) indexPhraseWords(FILLER_PHRASES[f]);
  for (var w = 0; w < WORDY_REPLACEMENTS.length; w++) indexPhraseWords(WORDY_REPLACEMENTS[w][0]);
  var TAIL_WORDS = ["help", "time", "assistance", "support", "kindness", "response"];
  for (var t = 0; t < TAIL_WORDS.length; t++) FILLER_WORDS[TAIL_WORDS[t]] = true;
  var WRAPPER_WORDS = ["preparing", "studying", "revising", "prepping", "trying"];
  for (var pw = 0; pw < WRAPPER_WORDS.length; pw++) FILLER_WORDS[WRAPPER_WORDS[pw]] = true;
  indexPhraseWords("getting ready");

  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function collapse(text) {
    return String(text)
      .replace(/\s+/g, " ")
      .replace(/\s*([,;:])\s*/g, "$1 ")
      .replace(/\s*([.!?])\s*/g, "$1 ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function removeFiller(text) {
    var out = " " + text + " ";
    for (var i = 0; i < FILLER_PHRASES.length; i++) {
      var re = new RegExp("\\b" + escapeRe(FILLER_PHRASES[i]) + "\\b", "gi");
      out = out.replace(re, " ");
    }
    return collapse(out);
  }

  function applyWordy(text) {
    var out = " " + text + " ";
    for (var i = 0; i < WORDY_REPLACEMENTS.length; i++) {
      var from = WORDY_REPLACEMENTS[i][0];
      var to = WORDY_REPLACEMENTS[i][1];
      var re = new RegExp("\\b" + escapeRe(from) + "\\b", "gi");
      out = out.replace(re, " " + to.trim() + " ");
    }
    return collapse(out);
  }

  function rewriteWrappers(text) {
    var out = text;
    out = out.replace(
      /^i (?:am|'m|was|have been) (?:preparing|studying|revising|getting ready|prepping|trying) for (.{0,80}?)\s+and i (?:want|need|would like)(?: (?:you|please))? to /i,
      "for $1: "
    );
    out = out.replace(/^i (?:want|need|would like|'d like) to /i, "");
    out = out.replace(/\b(?:and|also|so|then) i (?:want|need|would like) to /gi, " ");
    out = out.replace(/\bcould you please\b/gi, "");

    var eachMatch = out.match(/\beach ([a-z]+(?:-[a-z]+)*)\b/i);
    if (eachMatch) {
      var noun = eachMatch[1];
      var dupeRe = new RegExp("\\bfor (?:each|every) " + escapeRe(noun) + "\\b", "gi");
      var m;
      var lastIndex = -1;
      var lastLength = 0;
      while ((m = dupeRe.exec(out)) !== null) {
        lastIndex = m.index;
        lastLength = m[0].length;
      }
      if (lastIndex >= 0) {
        var first = dupeRe;
        first.lastIndex = 0;
        var firstMatch = first.exec(out);
        if (firstMatch && firstMatch.index !== lastIndex) {
          out = out.slice(0, lastIndex) + " " + out.slice(lastIndex + lastLength);
        }
      }
    }
    return out;
  }

  function removeTail(text) {
    return String(text).replace(
      /\s+(?:and\s+)?for your (?:help|time|assistance|support|kindness|response)\s*$/i,
      ""
    );
  }

  function preservesContent(original, optimized) {
    var originalTokens = String(original).toLowerCase().match(/[a-z']+/g) || [];
    var optimizedTokens = String(optimized).toLowerCase().match(/[a-z']+/g) || [];
    var present = {};
    for (var i = 0; i < optimizedTokens.length; i++) present[optimizedTokens[i]] = true;

    for (var j = 0; j < originalTokens.length; j++) {
      var word = originalTokens[j];
      if (word.length < 4) continue;
      if (STOP_SET[word]) continue;
      if (FILLER_WORDS[word]) continue;
      if (!present[word]) return false;
    }
    return true;
  }

  function optimizeText(original) {
    var input = String(original || "").trim();
    if (!input) return { text: original || "", changed: false };
    if (input.replace(/\s+/g, "").length < 32) return { text: input, changed: false };
    if (/[{}]/.test(input) && /[;]/.test(input) && input.split("\n").length >= 2) {
      return { text: input, changed: false };
    }

    var stage = collapse(input);
    stage = rewriteWrappers(stage);
    stage = removeFiller(stage);
    stage = applyWordy(stage);
    stage = removeTail(stage);
    stage = collapse(stage);
    stage = stage.replace(/,+/g, ",").replace(/,\s*([.!?])/g, "$1");
    stage = stage.replace(/^[,;:!?\s]+/, "");
    stage = stage.replace(/^you (?:could|can) /i, "");
    stage = stage.replace(/,+$/, "");
    stage = stage.replace(/\b(?:and|or|to|the)\s*$/i, "");
    stage = collapse(stage);
    stage = stage.replace(/\b(\w[\w'-]*) \1\b/gi, "$1");
    stage = collapse(stage);
    if (stage) stage = stage.charAt(0).toUpperCase() + stage.slice(1);

    if (!stage || stage.toLowerCase() === input.toLowerCase() || stage.length >= input.length) {
      return { text: input, changed: false };
    }
    if (!preservesContent(input, stage)) {
      return { text: input, changed: false };
    }
    return { text: stage, changed: true };
  }

  global.EcoRouteTextOptimizer = {
    optimizeText: optimizeText
  };
})(globalThis);