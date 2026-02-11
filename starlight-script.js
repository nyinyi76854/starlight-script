// starlight-script.js
// Simple Starlight language runtime

(function () {
  // Store variables
  const variables = {};

  // Helper to access DOM
  function whereElement(selector) {
    return {
      set: function(text) {
        const el = document.querySelector(selector);
        if(el) el.textContent = text;
        return this; // allow chaining
      },
      get: function() {
        const el = document.querySelector(selector);
        return el ? el.textContent : null;
      }
    };
  }

  // Evaluate expressions with variables and operators
  function evalExpression(expr) {
    try {
      // Replace variable names with values
      expr = expr.replace(/\b[a-zA-Z_]\w*\b/g, match => {
        return variables.hasOwnProperty(match) ? variables[match] : match;
      });
      return Function('"use strict"; return (' + expr + ')')();
    } catch(e) {
      console.error("Error evaluating:", expr, e);
      return null;
    }
  }

  // Main interpreter
  function runStarlight(tag) {
    const code = tag.textContent.trim().split("\n");
    code.forEach(line => {
      line = line.trim();
      if(line.startsWith("print ")) {
        const expr = line.slice(6);
        console.log(evalExpression(expr));
      } else if(line.startsWith("let ")) {
        // Variable assignment: let x = expr
        const match = line.match(/^let\s+(\w+)\s*=\s*(.+)$/);
        if(match) {
          const [, name, expr] = match;
          variables[name] = evalExpression(expr);
        }
      } else if(line.startsWith("whereElement(")) {
        // Parse whereElement
        const match = line.match(/^whereElement\(["'](.+)["']\)\.(.+)$/);
        if(match) {
          const [, selector, rest] = match;
          const elObj = whereElement(selector);
          // support set chaining
          if(rest.startsWith("set(")) {
            const val = rest.match(/^set\(["'](.+)["']\)$/)[1];
            elObj.set(val);
          }
        }
      }
    });
  }

  // Auto-run all <starlight> tags
  function runAll() {
    document.querySelectorAll('starlight').forEach(tag => runStarlight(tag));
  }

  if(document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runAll);
  } else {
    runAll();
  }

  // Expose to global
  window.runStarlight = runAll;
  window.whereElement = whereElement;

})();
