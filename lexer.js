// src/lexer.js

(function () {

  if (!window.Starlight) {
    window.Starlight = {};
  }

  function tokenize(input) {
    const tokens = [];
    const regex = /\s*(let|print|whereElement|set|\d+|"[^"]*"|\+|\-|\*|\/|=|\(|\)|\.|;|[A-Za-z_]\w*|#[A-Za-z_]\w*)\s*/g;

    let match;
    while ((match = regex.exec(input)) !== null) {
      tokens.push(match[1]);
    }

    return tokens;
  }

  window.Starlight.tokenize = tokenize;

})();
