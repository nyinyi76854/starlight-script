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
