function Parser(tokens) {
  this.tokens = tokens
  this.current = 0
}

Parser.prototype.peek = function () {
  return this.tokens[this.current]
}

Parser.prototype.previous = function () {
  return this.tokens[this.current - 1]
}

Parser.prototype.advance = function () {
  if (!this.isAtEnd()) this.current++
  return this.previous()
}

Parser.prototype.isAtEnd = function () {
  return this.peek().type === "EOF"
}

Parser.prototype.check = function (type) {
  if (this.isAtEnd()) return false
  return this.peek().type === type
}

Parser.prototype.match = function () {
  for (let i = 0; i < arguments.length; i++) {
    if (this.check(arguments[i])) {
      this.advance()
      return true
    }
  }
  return false
}

Parser.prototype.consume = function (type, message) {
  if (this.check(type)) return this.advance()
  throw new Error(message)
}

Parser.prototype.parse = function () {
  const body = []

  while (!this.isAtEnd()) {
    body.push(this.declaration())
  }

  return {
    type: "Program",
    body
  }
}

Parser.prototype.declaration = function () {
  if (this.match("LET", "CONST")) return this.variableDeclaration()
  if (this.match("FUNCTION")) return this.functionDeclaration()
  return this.statement()
}

Parser.prototype.variableDeclaration = function () {
  const kind = this.previous().type
  const name = this.consume("IDENTIFIER", "Expected variable name")

  let initializer = null
  if (this.match("EQUAL")) {
    initializer = this.expression()
  }

  return {
    type: "VariableDeclaration",
    kind,
    name: name.value,
    initializer
  }
}

Parser.prototype.functionDeclaration = function () {
  const name = this.consume("IDENTIFIER", "Expected function name")

  this.consume("LPAREN", "Expected '('")

  const params = []
  if (!this.check("RPAREN")) {
    do {
      const param = this.consume("IDENTIFIER", "Expected parameter name")
      params.push(param.value)
    } while (this.match("COMMA"))
  }

  this.consume("RPAREN", "Expected ')'")
  this.consume("LBRACE", "Expected '{'")

  const body = []
  while (!this.check("RBRACE") && !this.isAtEnd()) {
    body.push(this.declaration())
  }

  this.consume("RBRACE", "Expected '}'")

  return {
    type: "FunctionDeclaration",
    name: name.value,
    params,
    body
  }
}

Parser.prototype.statement = function () {
  if (this.match("IF")) return this.ifStatement()
  if (this.match("WHILE")) return this.whileStatement()
  if (this.match("FOR")) return this.forStatement()
  if (this.match("RETURN")) return this.returnStatement()
  if (this.match("BREAK")) return { type: "BreakStatement" }
  if (this.match("CONTINUE")) return { type: "ContinueStatement" }
  if (this.match("LBRACE")) return this.blockStatement()
  return this.expressionStatement()
}

Parser.prototype.blockStatement = function () {
  const body = []

  while (!this.check("RBRACE") && !this.isAtEnd()) {
    body.push(this.declaration())
  }

  this.consume("RBRACE", "Expected '}'")

  return {
    type: "BlockStatement",
    body
  }
}

Parser.prototype.ifStatement = function () {
  this.consume("LPAREN", "Expected '('")
  const test = this.expression()
  this.consume("RPAREN", "Expected ')'")

  const consequent = this.statement()
  let alternate = null

  if (this.match("ELSE")) {
    alternate = this.statement()
  }

  return {
    type: "IfStatement",
    test,
    consequent,
    alternate
  }
}

Parser.prototype.whileStatement = function () {
  this.consume("LPAREN", "Expected '('")
  const test = this.expression()
  this.consume("RPAREN", "Expected ')'")

  const body = this.statement()

  return {
    type: "WhileStatement",
    test,
    body
  }
}

Parser.prototype.forStatement = function () {
  this.consume("LPAREN", "Expected '('")

  const init = this.expression()
  this.consume("SEMICOLON", "Expected ';'")

  const test = this.expression()
  this.consume("SEMICOLON", "Expected ';'")

  const update = this.expression()
  this.consume("RPAREN", "Expected ')'")

  const body = this.statement()

  return {
    type: "ForStatement",
    init,
    test,
    update,
    body
  }
}

Parser.prototype.returnStatement = function () {
  const argument = this.expression()
  return {
    type: "ReturnStatement",
    argument
  }
}

Parser.prototype.expressionStatement = function () {
  const expression = this.expression()
  return {
    type: "ExpressionStatement",
    expression
  }
}

Parser.prototype.expression = function () {
  return this.assignment()
}

Parser.prototype.assignment = function () {
  const expr = this.logicalOr()

  if (this.match("EQUAL")) {
    const value = this.assignment()
    return {
      type: "AssignmentExpression",
      left: expr,
      right: value
    }
  }

  return expr
}

Parser.prototype.logicalOr = function () {
  let expr = this.logicalAnd()

  while (this.match("OPERATOR") && this.previous().value === "||") {
    const operator = this.previous().value
    const right = this.logicalAnd()
    expr = { type: "BinaryExpression", operator, left: expr, right }
  }

  return expr
}

Parser.prototype.logicalAnd = function () {
  let expr = this.equality()

  while (this.match("OPERATOR") && this.previous().value === "&&") {
    const operator = this.previous().value
    const right = this.equality()
    expr = { type: "BinaryExpression", operator, left: expr, right }
  }

  return expr
}

Parser.prototype.equality = function () {
  let expr = this.comparison()

  while (this.match("OPERATOR")) {
    const operator = this.previous().value
    if (["==", "!=", "===", "!=="].includes(operator)) {
      const right = this.comparison()
      expr = { type: "BinaryExpression", operator, left: expr, right }
    }
  }

  return expr
}

Parser.prototype.comparison = function () {
  let expr = this.term()

  while (this.match("GREATER", "LESS")) {
    const operator = this.previous().value
    const right = this.term()
    expr = { type: "BinaryExpression", operator, left: expr, right }
  }

  return expr
}

Parser.prototype.term = function () {
  let expr = this.factor()

  while (this.match("PLUS", "MINUS")) {
    const operator = this.previous().value
    const right = this.factor()
    expr = { type: "BinaryExpression", operator, left: expr, right }
  }

  return expr
}

Parser.prototype.factor = function () {
  let expr = this.unary()

  while (this.match("STAR", "SLASH", "MOD")) {
    const operator = this.previous().value
    const right = this.unary()
    expr = { type: "BinaryExpression", operator, left: expr, right }
  }

  return expr
}

Parser.prototype.unary = function () {
  if (this.match("BANG", "MINUS")) {
    const operator = this.previous().value
    const right = this.unary()
    return {
      type: "UnaryExpression",
      operator,
      argument: right
    }
  }

  return this.call()
}

Parser.prototype.call = function () {
  let expr = this.primary()

  while (true) {
    if (this.match("LPAREN")) {
      const args = []

      if (!this.check("RPAREN")) {
        do {
          args.push(this.expression())
        } while (this.match("COMMA"))
      }

      this.consume("RPAREN", "Expected ')'")
      expr = {
        type: "CallExpression",
        callee: expr,
        arguments: args
      }
    } else {
      break
    }
  }

  return expr
}

Parser.prototype.primary = function () {
  if (this.match("NUMBER")) {
    return { type: "Literal", value: Number(this.previous().value) }
  }

  if (this.match("STRING")) {
    return { type: "Literal", value: this.previous().value }
  }

  if (this.match("TRUE")) return { type: "Literal", value: true }
  if (this.match("FALSE")) return { type: "Literal", value: false }
  if (this.match("NULL")) return { type: "Literal", value: null }

  if (this.match("IDENTIFIER", "SHOW")) {
    return {
      type: "Identifier",
      name: this.previous().value
    }
  }

  if (this.match("LPAREN")) {
    const expr = this.expression()
    this.consume("RPAREN", "Expected ')'")
    return expr
  }

  throw new Error("Unexpected token: " + this.peek().type)
}

function parse(tokens) {
  const parser = new Parser(tokens)
  return parser.parse()
}
