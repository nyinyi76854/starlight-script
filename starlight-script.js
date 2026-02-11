// starlight-script.js
(function () {
  const variables = {};

  // Helper to access DOM elements
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
      expr = expr.replace(/\b[a-zA-Z_]\w*\b/g, match => {
        return variables.hasOwnProperty(match) ? variables[match] : match;
      });
      return Function('"use strict"; return (' + expr + ')')();
    } catch(e) {
      console.error("Error evaluating:", expr, e);
      return null;
    }
  }

  // Process a single statement
  function runStatement(line) {
    line = line.trim();
    if(!line) return;

    // print statement
    if(line.startsWith("print ")) {
      const expr = line.slice(6);
      console.log(evalExpression(expr));
    } 
    // variable assignment
    else if(line.startsWith("let ")) {
      const match = line.match(/^let\s+(\w+)\s*=\s*(.+)$/);
      if(match) {
        const [, name, expr] = match;
        variables[name] = evalExpression(expr);
      }
    } 
    // whereElement DOM manipulation
    else if(line.startsWith("whereElement(")) {
      const match = line.match(/^whereElement\(["'](.+?)["']\)\.(.+)$/);
      if(match) {
        const [, selector, rest] = match;
        const elObj = whereElement(selector);
        // currently only support set("value")
        const setMatch = rest.match(/^set\(["'](.+?)["']\)$/);
        if(setMatch) elObj.set(setMatch[1]);
      }
    } else {
      console.warn("Unknown Starlight statement:", line);
    }
  }

  // Run code in a <starlight> tag
  function runStarlightTag(tag) {
    // Split by semicolon or newline
    const code = tag.textContent
      .split(/;|\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    code.forEach(runStatement);
  }

  // Run all <starlight> tags
  function runAll() {
    document.querySelectorAll('starlight').forEach(runStarlightTag);
  }

  if(document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runAll);
  } else {
    runAll();
  }

  window.runStarlight = runAll;
  window.whereElement = whereElement;

})();
