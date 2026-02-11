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
