

// --- src/syntax.js ---
// src/syntax.js
window.Starlight = window.Starlight || {};

Starlight.Syntax = {
  // Simple keywords
  keywords: {
    "print": function(args) { return `console.log(${args.join(' ')})`; },
    "let": function(args) { return `let ${args.join(' ')}`; },
    "set": function(args) { return `${args[0]} = ${args[1]}`; }
  },

  // Simple operator mapping
  operators: {
    "plus": "+",
    "minus": "-",
    "times": "*",
    "divided_by": "/"
  },

  // Transform a single line of Starlight code into JS
  transformLine: function(line) {
    line = line.trim();
    
    // Replace operators
    for (var op in this.operators) {
      line = line.replace(new RegExp("\\b" + op + "\\b", "g"), this.operators[op]);
    }

    // Handle keywords
    for (var key in this.keywords) {
      if (line.startsWith(key)) {
        var rest = line.slice(key.length).trim().split(/\s+/);
        return this.keywords[key](rest);
      }
    }

    return line; // fallback: return as-is
  }
};


// --- src/core/parser.js ---
// src/core/parser.js
window.Starlight = window.Starlight || {};

Starlight.Parser = {
  parse: function(code) {
    // Split by lines, ignore empty lines
    var lines = code.split('\n').map(line => line.trim()).filter(line => line);
    // Transform each line to JS
    var jsLines = lines.map(line => Starlight.Syntax.transformLine(line));
    return jsLines.join('\n');
  }
};


// --- src/core/runtime.js ---
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


// --- src/index.js ---
// src/index.js
window.Starlight = window.Starlight || {};

class StarlightElement extends HTMLElement {
  connectedCallback() {
    const code = this.textContent;
    this.textContent = ""; // clear original code
    Starlight.Runtime.run(code, this);
  }
}

// Register the custom element
customElements.define('starlight', StarlightElement);
