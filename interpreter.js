(function () {

  if (!window.Starlight || !window.Starlight.parse) {
    throw new Error("Load parser.js first.");
  }

  const parse = window.Starlight.parse;

  function run(code) {

    const ast = parse(code);
    const env = {};

    function evaluate(node) {

      switch (node.type) {

        case "Program":
          node.body.forEach(evaluate);
          break;

        case "NumberLiteral":
          return node.value;

        case "StringLiteral":
          return node.value;

        case "Identifier":
          return env[node.name];

        case "BinaryExpression":
          const left = evaluate(node.left);
          const right = evaluate(node.right);

          switch (node.operator) {
            case "+": return left + right;
            case "-": return left - right;
            case "*": return left * right;
            case "/": return left / right;
          }
          break;

        case "VariableDeclaration":
          env[node.name] = evaluate(node.value);
          break;

        case "PrintStatement":
          console.log(evaluate(node.argument));
          break;

        case "WhereCall":
          const value = evaluate(node.argument);
          const el = document.querySelector(node.selector);
          if (el) el.textContent = value;
          break;
      }
    }

    evaluate(ast);
  }

  window.Starlight.run = run;

  // 🔥 AUTO RUN <script type="text/starlight">
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('script[type="text/starlight"]').forEach(tag => {
      run(tag.textContent.trim());
    });
  });

})();
