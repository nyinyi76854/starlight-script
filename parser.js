(function () {

  if (!window.Starlight || !window.Starlight.tokenize) {
    throw new Error("Load lexer.js first.");
  }

  const tokenize = window.Starlight.tokenize;

  function parse(input) {

    const tokens = tokenize(input);
    let current = 0;

    function walk() {
      let token = tokens[current];

      if (/^\d+$/.test(token)) {
        current++;
        return { type: "NumberLiteral", value: Number(token) };
      }

      if (/^".*"$/.test(token)) {
        current++;
        return { type: "StringLiteral", value: token.slice(1, -1) };
      }

      if (/^[A-Za-z_]\w*$/.test(token)) {
        current++;
        return { type: "Identifier", name: token };
      }

      throw new Error("Unexpected token: " + token);
    }

    function parseExpression() {
      let left = walk();

      while (["+", "-", "*", "/"].includes(tokens[current])) {
        const operator = tokens[current++];
        const right = walk();
        left = {
          type: "BinaryExpression",
          operator,
          left,
          right
        };
      }

      return left;
    }

    const ast = { type: "Program", body: [] };

    while (current < tokens.length) {
      let token = tokens[current];

      // Variable
      if (token === "let") {
        current++;
        const name = tokens[current++];
        current++; // =
        const value = parseExpression();
        current++; // ;
        ast.body.push({
          type: "VariableDeclaration",
          name,
          value
        });
        continue;
      }

      // Print
      if (token === "print") {
        current++;
        current++; // (
        const argument = parseExpression();
        current++; // )
        current++; // ;
        ast.body.push({
          type: "PrintStatement",
          argument
        });
        continue;
      }

      // whereElement
      if (token === "whereElement") {
        current++; // whereElement
        current++; // (
        const selectorToken = tokens[current++];
        const selector = selectorToken.slice(1, -1);
        current++; // )
        current++; // .
        current++; // set
        current++; // (
        const argument = parseExpression();
        current++; // )
        current++; // ;

        ast.body.push({
          type: "WhereCall",
          selector,
          argument
        });
        continue;
      }

      current++;
    }

    return ast;
  }

  window.Starlight.parse = parse;

})();
