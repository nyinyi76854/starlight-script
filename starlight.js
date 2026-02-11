/* Starlight.js - Auto-generated */
/* ===== lexer.js ===== */
const KEYWORDS = {
  star: "LET",
  constel: "CONST",
  nova: "FUNCTION",
  emit: "RETURN",
  when: "IF",
  otherwise: "ELSE",
  loop: "WHILE",
  repeat: "FOR",
  stop: "BREAK",
  skip: "CONTINUE",
  tryit: "TRY",
  catchit: "CATCH",
  finallyit: "FINALLY",
  throwit: "THROW",
  classy: "CLASS",
  extend: "EXTENDS",
  newstar: "NEW",
  thisstar: "THIS",
  yes: "TRUE",
  no: "FALSE",
  voidstar: "NULL",
  show: "SHOW"
}
const SINGLE_CHAR_TOKENS = {
  "(": "LPAREN",
  ")": "RPAREN",
  "{": "LBRACE",
  "}": "RBRACE",
  "[": "LBRACKET",
  "]": "RBRACKET",
  ",": "COMMA",
  ";": "SEMICOLON",
  ".": "DOT",
  "+": "PLUS",
  "-": "MINUS",
  "*": "STAR",
  "/": "SLASH",
  "%": "MOD",
  "=": "EQUAL",
  ">": "GREATER",
  "<": "LESS",
  "!": "BANG",
  "&": "AMP",
  "|": "PIPE",
  "^": "CARET",
  "~": "TILDE",
  "?": "QUESTION",
  ":": "COLON"
}
const TWO_CHAR_OPERATORS = [
  "==", "!=", ">=", "<=",
  "&&", "||",
  "++", "--",
  "+=", "-=", "*=", "/=", "%=",
  "=>"
]
const THREE_CHAR_OPERATORS = [
  "===", "!=="
]
export function tokenize(input) {
  const tokens = []
  let current = 0
  while (current < input.length) {
    let char = input[current]
    if (/\s/.test(char)) {
      current++
      continue
    }
    if (char === "/" && input[current + 1] === "/") {
      while (input[current] !== "\n" && current < input.length) {
        current++
      }
      continue
    }
    if (char === "/" && input[current + 1] === "*") {
      current += 2
      while (!(input[current] === "*" && input[current + 1] === "/")) {
        current++
        if (current >= input.length) {
          throw new Error("Unterminated comment")
        }
      }
      current += 2
      continue
    }
    if (/[0-9]/.test(char)) {
      let value = ""
      while (/[0-9]/.test(input[current])) {
        value += input[current++]
      }
      if (input[current] === ".") {
        value += input[current++]
        while (/[0-9]/.test(input[current])) {
          value += input[current++]
        }
      }
      tokens.push({ type: "NUMBER", value })
      continue
    }
    if (char === '"' || char === "'" || char === "`") {
      const quote = char
      let value = ""
      current++
      while (input[current] !== quote) {
        if (current >= input.length) {
          throw new Error("Unterminated string")
        }
        if (input[current] === "\\") {
          value += input[current]
          current++
        }
        value += input[current++]
      }
      current++
      tokens.push({ type: "STRING", value })
      continue
    }
    if (/[a-zA-Z_$]/.test(char)) {
      let value = ""
      while (/[a-zA-Z0-9_$]/.test(input[current])) {
        value += input[current++]
      }
      if (KEYWORDS[value]) {
        tokens.push({
          type: KEYWORDS[value],
          value
        })
      } else {
        tokens.push({
          type: "IDENTIFIER",
          value
        })
      }
      continue
    }
    const threeChar = input.slice(current, current + 3)
    if (THREE_CHAR_OPERATORS.includes(threeChar)) {
      tokens.push({ type: "OPERATOR", value: threeChar })
      current += 3
      continue
    }
    const twoChar = input.slice(current, current + 2)
    if (TWO_CHAR_OPERATORS.includes(twoChar)) {
      tokens.push({ type: "OPERATOR", value: twoChar })
      current += 2
      continue
    }
    if (SINGLE_CHAR_TOKENS[char]) {
      tokens.push({
        type: SINGLE_CHAR_TOKENS[char],
        value: char
      })
      current++
      continue
    }
    throw new Error("Unexpected character: " + char)
  }
  tokens.push({ type: "EOF", value: null })
  return tokens
}
/* ===== parser.js ===== */
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
/* ===== compiler.js ===== */
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
/* ===== runtime.js ===== */
(function (global) {
  const StarlightRuntime = {}
  StarlightRuntime.execute = function (jsCode) {
    try {
      const fn = new Function("Starlight", jsCode)
      fn(StarlightRuntime)
    } catch (err) {
      console.error("[Starlight Runtime Error]", err)
    }
  }
  StarlightRuntime.html = function (tag, props) {
    const element = document.createElement(tag)
    if (props && typeof props === "object") {
      Object.keys(props).forEach(function (key) {
        const value = props[key]
        if (key.startsWith("on") && typeof value === "function") {
          const event = key.slice(2).toLowerCase()
          element.addEventListener(event, value)
        } else if (key === "style" && typeof value === "object") {
          Object.assign(element.style, value)
        } else {
          element.setAttribute(key, value)
        }
      })
    }
    for (let i = 2; i < arguments.length; i++) {
      const child = arguments[i]
      if (child instanceof Node) {
        element.appendChild(child)
      } else if (child !== null && child !== undefined) {
        element.appendChild(document.createTextNode(child))
      }
    }
    return element
  }
  StarlightRuntime.mount = function (selector, component) {
    const target =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector
    if (!target) {
      console.error("[Starlight] Mount target not found:", selector)
      return
    }
    target.innerHTML = ""
    target.appendChild(component)
  }
  StarlightRuntime.state = function (initialValue) {
    const listeners = new Set()
    const obj = {
      _value: initialValue,
      get value() {
        return this._value
      },
      set value(newValue) {
        this._value = newValue
        listeners.forEach(function (fn) {
          fn(newValue)
        })
      },
      subscribe(fn) {
        listeners.add(fn)
      }
    }
    return obj
  }
  StarlightRuntime.bindText = function (stateObj) {
    const textNode = document.createTextNode(stateObj.value)
    stateObj.subscribe(function (newValue) {
      textNode.textContent = newValue
    })
    return textNode
  }
  StarlightRuntime.bindAttr = function (element, attr, stateObj) {
    element.setAttribute(attr, stateObj.value)
    stateObj.subscribe(function (newValue) {
      element.setAttribute(attr, newValue)
    })
  }
  StarlightRuntime.component = function (renderFn) {
    return function () {
      return renderFn()
    }
  }
  function runStarlightTags() {
    const tags = document.querySelectorAll("starlight")
    tags.forEach(function (tag) {
      const code = tag.textContent
      if (!code.trim()) return
      if (!global.StarlightCompile) {
        console.error("[Starlight] Compiler not loaded")
        return
      }
      const js = global.StarlightCompile(code)
      StarlightRuntime.execute(js)
    })
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runStarlightTags)
  } else {
    runStarlightTags()
  }
  global.Starlight = StarlightRuntime
})(window)
/* ===== dom.js ===== */
const DOM = (function () {
  /* ============================
     1. Create Text Node
  ============================ */
  function createText(value) {
    return document.createTextNode(
      value !== undefined && value !== null ? String(value) : ""
    )
  }
  /* ============================
     2. Create Element
  ============================ */
  function createElement(tag) {
    return document.createElement(tag)
  }
  /* ============================
     3. Create Fragment
  ============================ */
  function createFragment() {
    return document.createDocumentFragment()
  }
  /* ============================
     4. Set Attribute
  ============================ */
  function setAttribute(el, key, value) {
    if (key === "className") {
      el.setAttribute("class", value)
      return
    }
    if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value)
      return
    }
    if (key.startsWith("on") && typeof value === "function") {
      const event = key.slice(2).toLowerCase()
      el.addEventListener(event, value)
      return
    }
    if (value === false || value === null || value === undefined) {
      el.removeAttribute(key)
      return
    }
    el.setAttribute(key, value)
  }
  /* ============================
     5. Remove Attribute
  ============================ */
  function removeAttribute(el, key) {
    el.removeAttribute(key)
  }
  /* ============================
     6. Append Child
  ============================ */
  function appendChild(parent, child) {
    if (child === null || child === undefined) return
    if (Array.isArray(child)) {
      child.forEach(c => appendChild(parent, c))
      return
    }
    if (typeof child === "string" || typeof child === "number") {
      parent.appendChild(createText(child))
      return
    }
    parent.appendChild(child)
  }
  /* ============================
     7. Remove Child
  ============================ */
  function removeChild(parent, child) {
    if (parent && child) {
      parent.removeChild(child)
    }
  }
  /* ============================
     8. Clear Element
  ============================ */
  function clear(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
  }
  /* ============================
     9. Replace Node
  ============================ */
  function replace(oldNode, newNode) {
    if (oldNode.parentNode) {
      oldNode.parentNode.replaceChild(newNode, oldNode)
    }
  }
  /* ============================
     10. Mount Element
  ============================ */
  function mount(target, element) {
    const container =
      typeof target === "string"
        ? document.querySelector(target)
        : target
    if (!container) {
      throw new Error("Mount target not found: " + target)
    }
    clear(container)
    appendChild(container, element)
  }
  /* ============================
     11. Unmount Element
  ============================ */
  function unmount(target) {
    const container =
      typeof target === "string"
        ? document.querySelector(target)
        : target
    if (!container) return
    clear(container)
  }
  /* ============================
     12. Patch Text Node
  ============================ */
  function updateText(node, value) {
    if (node && node.nodeType === 3) {
      node.textContent = value
    }
  }
  /* ============================
     13. Patch Attribute
  ============================ */
  function updateAttribute(el, key, newValue) {
    setAttribute(el, key, newValue)
  }
  /* ============================
     14. Create Full Element Helper
     h("div", {id:"app"}, child1, child2)
  ============================ */
  function h(tag, props) {
    const el = createElement(tag)
    if (props && typeof props === "object") {
      Object.keys(props).forEach(key => {
        setAttribute(el, key, props[key])
      })
    }
    for (let i = 2; i < arguments.length; i++) {
      appendChild(el, arguments[i])
    }
    return el
  }
  /* ============================
     15. Reactive Text Binding
  ============================ */
  function bindText(stateObj) {
    const textNode = createText(stateObj.value)
    if (stateObj && typeof stateObj.subscribe === "function") {
      stateObj.subscribe(function (newValue) {
        updateText(textNode, newValue)
      })
    }
    return textNode
  }
  /* ============================
     16. Reactive Attribute Binding
  ============================ */
  function bindAttribute(el, attr, stateObj) {
    setAttribute(el, attr, stateObj.value)
    if (stateObj && typeof stateObj.subscribe === "function") {
      stateObj.subscribe(function (newValue) {
        updateAttribute(el, attr, newValue)
      })
    }
  }
  /* ============================
     17. Export API
  ============================ */
  return {
    createText,
    createElement,
    createFragment,
    setAttribute,
    removeAttribute,
    appendChild,
    removeChild,
    clear,
    replace,
    mount,
    unmount,
    updateText,
    updateAttribute,
    h,
    bindText,
    bindAttribute
  }
})()
/* ===== core.js ===== */
(function (global) {
  function reactive(initialValue) {
    let value = initialValue
    const subscribers = []
    function notify(newVal) {
      value = newVal
      subscribers.forEach(fn => fn(value))
    }
    return {
      get value() {
        return value
      },
      set value(val) {
        notify(val)
      },
      subscribe(fn) {
        if (typeof fn === "function") subscribers.push(fn)
      }
    }
  }
  function execute(code, context = {}) {
    const keys = Object.keys(context)
    const values = Object.values(context)
    const func = new Function(...keys, code)
    return func(...values)
  }
  function mount(selector, code, context = {}) {
    const container = typeof selector === "string" ? document.querySelector(selector) : selector
    if (!container) {
      throw new Error("Mount target not found: " + selector)
    }
    try {
      const tokens = StarlightLexer.tokenize(code)
      const ast = StarlightParser(tokens)
      const jsCode = StarlightCompiler.compile(ast)
      context.DOM = DOM
      context.reactive = reactive
      const root = execute(jsCode, context)
      if (root) DOM.mount(container, root)
    } catch (e) {
      console.error("Starlight Core Error:", e)
      container.innerHTML = "<pre style='color:red'>" + e.stack + "</pre>"
    }
  }
  function evalCode(code, context = {}) {
    try {
      const tokens = StarlightLexer.tokenize(code)
      const ast = StarlightParser(tokens)
      const jsCode = StarlightCompiler.compile(ast)
      context.DOM = DOM
      context.reactive = reactive
      return execute(jsCode, context)
    } catch (e) {
      console.error("Starlight Eval Error:", e)
    }
  }
  function mountAll() {
    const elements = document.querySelectorAll("starlight")
    elements.forEach(el => {
      const code = el.textContent
      mount(el, code)
    })
  }
  global.Starlight = {
    reactive,
    mount,
    eval: evalCode,
    mountAll
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll)
  } else {
    mountAll()
  }
})(window)
