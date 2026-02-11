function compile(ast) {
  return generate(ast)
}

function generate(node) {
  switch (node.type) {

    case "Program":
      return node.body.map(generate).join("\n")

    case "VariableDeclaration":
      return (
        (node.kind === "LET" ? "let " : "const ") +
        node.name +
        (node.initializer ? " = " + generate(node.initializer) : "") +
        ";"
      )

    case "FunctionDeclaration":
      return (
        "function " +
        node.name +
        "(" +
        node.params.join(", ") +
        ") {\n" +
        node.body.map(generate).join("\n") +
        "\n}"
      )

    case "BlockStatement":
      return "{\n" + node.body.map(generate).join("\n") + "\n}"

    case "IfStatement":
      return (
        "if (" +
        generate(node.test) +
        ") " +
        generate(node.consequent) +
        (node.alternate ? " else " + generate(node.alternate) : "")
      )

    case "WhileStatement":
      return (
        "while (" +
        generate(node.test) +
        ") " +
        generate(node.body)
      )

    case "ForStatement":
      return (
        "for (" +
        generate(node.init) +
        " " +
        generate(node.test) +
        "; " +
        generate(node.update) +
        ") " +
        generate(node.body)
      )

    case "ReturnStatement":
      return "return " + generate(node.argument) + ";"

    case "BreakStatement":
      return "break;"

    case "ContinueStatement":
      return "continue;"

    case "ExpressionStatement":
      return generate(node.expression) + ";"

    case "AssignmentExpression":
      return (
        generate(node.left) +
        " = " +
        generate(node.right)
      )

    case "BinaryExpression":
      return (
        generate(node.left) +
        " " +
        node.operator +
        " " +
        generate(node.right)
      )

    case "UnaryExpression":
      return (
        node.operator +
        generate(node.argument)
      )

    case "CallExpression":
      return (
        generate(node.callee) +
        "(" +
        node.arguments.map(generate).join(", ") +
        ")"
      )

    case "Identifier":
      if (node.name === "show") {
        return "console.log"
      }
      return node.name

    case "Literal":
      if (typeof node.value === "string") {
        return JSON.stringify(node.value)
      }
      if (node.value === null) return "null"
      return String(node.value)

    default:
      throw new Error("Unknown node type: " + node.type)
  }
}
