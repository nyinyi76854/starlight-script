// src/parser.js

(function () {

  if (!window.Starlight) {
    throw new Error("Lexer must be loaded before parser.");
  }

  const tokenize = window.Starlight.tokenize;

  function parse(input) {

    const tokens = tokenize(input);
    let current = 0;

    function walk() {
      let token = tokens[current];

      if (/^\d+$/.test(token)) {
        current++;
        return { type: 'NumberLiteral', value: Number(token) };
      }

      if (/^".*"$/.test(token)) {
        current++;
        return { type: 'StringLiteral', value: token.slice(1, -1) };
      }

      if (/^[A-Za-z_]\w*$/.test(token)) {
        current++;
        return { type: 'Identifier', name: token };
      }

      if (token === 'whereElement') {
        current++; // whereElement
        current++; // (
        const selector = tokens[current++].replace(/"/g, '');
        current++; // )
        current++; // .
        const method = tokens[current++];
        current++; // (
        const argument = parseExpression();
        current++; // )

        return {
          type: 'WhereCall',
          selector,
          method,
          argument
        };
      }

      throw new Error("Unexpected token: " + token);
    }

    function parseExpression() {
      let left = walk();

      while (['+', '-', '*', '/'].includes(tokens[current])) {
        const operator = tokens[current++];
        const right = walk();
        left = {
          type: 'BinaryExpression',
          operator,
          left,
          right
        };
      }

      return left;
    }

    const ast = { type: 'Program', body: [] };

    while (current < tokens.length) {
      let token = tokens[current];

      if (token === 'let') {
        current++;
        const name = tokens[current++];
        current++; // =
        const value = parseExpression();
        current++; // ;
        ast.body.push({
          type: 'VariableDeclaration',
          name,
          value
        });
        continue;
      }

      if (token === 'print') {
        current++;
        current++; // (
        const argument = parseExpression();
        current++; // )
        current++; // ;
        ast.body.push({
          type: 'PrintStatement',
          argument
        });
        continue;
      }

      const expr = walk();
      current++; // ;
      ast.body.push(expr);
    }

    return ast;
  }

  window.Starlight.parse = parse;

})();
