const viewTags = {
  html: "SLContainer",
  body: "SLContainer",
  div: "SLContainer",
  section: "SLContainer",
  header: "SLHeader",
  footer: "SLFooter",
  article: "SLArticle",
  aside: "SLSidebar",
  nav: "SLNavigation",
  ul: "SLList",
  ol: "SLList",
  li: "SLListItem",
  span: "SLLabel",
  p: "SLLabel",
  h1: "SLTitle",
  h2: "SLSubtitle",
  h3: "SLLabel",
  h4: "SLLabel",
  h5: "SLLabel",
  h6: "SLLabel",
  button: "SLButton",
  input: "SLTextField",
  textarea: "SLTextArea",
  select: "SLDropdown",
  option: "SLOption",
  checkbox: "SLCheckbox",
  radio: "SLRadioButton",
  form: "SLForm",
  label: "SLLabel",
  fieldset: "SLFieldset",
  legend: "SLLabel",
  img: "SLImage",
  video: "SLVideo",
  table: "SLTable",
  tr: "SLTableRow",
  td: "SLTableCell",
  th: "SLTableCell",
  a: "SLLink",
  canvas: "SLCanvas",
  svg: "SLSVG",
  path: "SLSVGPath",
  circle: "SLSVGCircle",
  rect: "SLSVGRect",
  line: "SLSVGLine",
  polyline: "SLSVGPolyline",
  polygon: "SLSVGPolygon",
  text: "SLSVGText",
  g: "SLSVGGroup",
  iframe: "SLFrame",
  picture: "SLPicture",
  map: "SLMap",
  area: "SLMapArea",
  object: "SLObject",
  embed: "SLEmbed",
  param: "SLParam",
  figure: "SLFigure",
  figcaption: "SLLabel",
  progress: "SLProgress",
  meter: "SLMeter",
  datalist: "SLDataList",
  output: "SLLabel",
  blockquote: "SLBlockquote",
  pre: "SLPre",
  code: "SLCode",
  small: "SLLabel",
  strong: "SLLabel",
  em: "SLLabel",
  mark: "SLLabel",
  hr: "SLDivider",
  time: "SLLabel",
  summary: "SLLabel",
  details: "SLDetails"

};

class Token {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
  }

  isLetter(char) {
    return /[a-zA-Z_]/.test(char);
  }

  isWhitespace(char) {
    return /\s/.test(char);
  }

  tokenize() {
    const tokens = [];

    while (this.position < this.input.length) {
      let char = this.input[this.position];

      if (this.isWhitespace(char)) {
        this.position++;
        continue;
      }

      if (this.isLetter(char)) {
        let value = "";
        while (
          this.position < this.input.length &&
          /[a-zA-Z0-9_.]/.test(this.input[this.position])
        ) {
          value += this.input[this.position++];
        }
        tokens.push(new Token("IDENTIFIER", value));
        continue;
      }

      if (char === '"') {
        this.position++;
        let value = "";
        while (this.input[this.position] !== '"') {
          value += this.input[this.position++];
        }
        this.position++;
        tokens.push(new Token("STRING", value));
        continue;
      }

      if (char === "{") {
        tokens.push(new Token("LBRACE", "{"));
        this.position++;
        continue;
      }

      if (char === "}") {
        tokens.push(new Token("RBRACE", "}"));
        this.position++;
        continue;
      }

      if (char === "=") {
        tokens.push(new Token("EQUALS", "="));
        this.position++;
        continue;
      }

      this.position++;
    }

    return tokens;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  current() {
    return this.tokens[this.position];
  }

  peek(offset = 1) {
    return this.tokens[this.position + offset];
  }

  eat(type) {
    const token = this.current();
    if (!token) throw new Error(`Unexpected end of input, expected ${type}`);
    if (type && token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type}`);
    }
    this.position++;
    return token;
  }

  parse() {
    const body = [];
    while (this.position < this.tokens.length) {
      body.push(this.parseElement());
    }
    return { type: "Program", body };
  }

  parseElement() {
    const nameToken = this.eat("IDENTIFIER");
    const name = nameToken.value;

    if (name === "StyleSheet") {
      return this.parseStyleSheet();
    }

    const props = {};
    while (this.current() && this.current().type === "IDENTIFIER") {
      const key = this.eat("IDENTIFIER").value;
      if (this.current() && this.current().type === "EQUALS") {
        this.eat("EQUALS");
        const valToken = this.current();
        if (valToken.type === "STRING" || valToken.type === "IDENTIFIER") {
          props[key] = this.eat(valToken.type).value;
        } else if (valToken.type === "LBRACE") {
          this.eat("LBRACE");
          let expr = "";
          while (this.current().type !== "RBRACE") {
            expr += this.eat(this.current().type).value || "";
          }
          this.eat("RBRACE");
          props[key] = `{${expr}}`;
        }
      } else {
        props[key] = true;
      }
    }

    let children = [];
    if (this.current() && this.current().type === "STRING") {
      children.push({ type: "Text", value: this.eat("STRING").value });
    } else if (this.current() && this.current().type === "LBRACE") {
      this.eat("LBRACE");
      while (this.current() && this.current().type !== "RBRACE") {
        children.push(this.parseElement());
      }
      this.eat("RBRACE");
    }

    return { type: "Element", name, props, children };
  }

  parseStyleSheet() {
    this.eat("IDENTIFIER"); // StyleSheet
    this.eat("LBRACE");
    const styles = {};
    while (this.current() && this.current().type !== "RBRACE") {
      const key = this.eat("IDENTIFIER").value;
      this.eat("LBRACE");
      const styleObj = {};
      while (this.current() && this.current().type !== "RBRACE") {
        const prop = this.eat("IDENTIFIER").value;
        let val;
        if (this.current().type === "STRING") {
          val = this.eat("STRING").value;
        } else if (this.current().type === "IDENTIFIER") {
          val = this.eat("IDENTIFIER").value;
        } else if (this.current().type === "LBRACE") {
          this.eat("LBRACE");
          val = "";
          while (this.current() && this.current().type !== "RBRACE") {
            val += this.eat(this.current().type).value;
          }
          this.eat("RBRACE");
        }
        styleObj[prop] = val;
      }
      this.eat("RBRACE");
      styles[key] = styleObj;
    }
    this.eat("RBRACE");
    return { type: "StyleSheet", styles };
  }
}

class CodeGenerator {
  generate(node) {
    switch (node.type) {
      case "Program":
        return node.body.map(n => this.generate(n)).join("\n");
      case "StyleSheet":
        return `const styles = ${JSON.stringify(node.styles, null, 2)};`;
      case "Element":
        return this.generateElement(node);
      case "Text":
        return this.transformText(node.value);
      default:
        throw new Error("Unknown node type: " + node.type);
    }
  }

  transformText(text) {
    if (text.includes("{")) {
      return `\`${text.replace(/\{(.*?)\}/g, "${$1}")}\``;
    }
    return `"${text}"`;
  }

  generateElement(node) {
    const mappedTag = viewTags[node.name] || node.name;
    const propsParts = [];

    for (let key in node.props) {
      const value = node.props[key];
      if (value === true) propsParts.push(`${key}: true`);
      else if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
        propsParts.push(`${key}: ${value.slice(1, -1)}`);
      } else {
        propsParts.push(`${key}: ${JSON.stringify(value)}`);
      }
    }

    const propsString = `{ ${propsParts.join(", ")} }`;
    const children = node.children.map(c => this.generate(c)).join(", ");
    return `createElement("${mappedTag}", ${propsString}${children ? ", " + children : ""})`;
  }
}


export class HTMLCompiler {
  compile(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const generator = new CodeGenerator();
    return generator.generate(ast);
  }
}

export function createElement(type, props, ...children) {
  return {
    type,
    props: props || {},
    children: children.flat()
  };
}

export default HTMLCompiler;
