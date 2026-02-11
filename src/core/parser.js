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
