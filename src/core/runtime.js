// src/core/runtime.js
window.Starlight = window.Starlight || {};

Starlight.Runtime = {
  run: function(code, element) {
    try {
      // Parse code to JS
      var jsCode = Starlight.Parser.parse(code);
      // Execute the JS code
      eval(jsCode);
    } catch (e) {
      console.error("Starlight Error:", e);
      if (element) element.textContent = "Error: " + e.message;
    }
  }
};
