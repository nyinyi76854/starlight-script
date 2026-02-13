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
    const name = this.eat("IDENTIFIER").value;
    const props = {};

    while (
      this.current() &&
      this.current().type === "IDENTIFIER"
    ) {
      const keyToken = this.current();
      const next = this.peek();

      if (!next || next.type !== "EQUALS") {
        props[keyToken.value] = true;
        this.eat("IDENTIFIER");
        continue;
      }

      const key = this.eat("IDENTIFIER").value;
      this.eat("EQUALS");

      const valueToken = this.current();

      if (!valueToken) break;

      if (valueToken.type === "STRING") {
        props[key] = this.eat("STRING").value;
      }

      else if (valueToken.type === "IDENTIFIER") {
        props[key] = this.eat("IDENTIFIER").value;
      }

      else if (valueToken.type === "LBRACE") {
        this.eat("LBRACE");

        let expr = "";
        while (this.current() && this.current().type !== "RBRACE") {
          expr += this.eat(this.current().type).value || "";
        }

        this.eat("RBRACE");
        props[key] = `{${expr}}`;
      }
    }

    let children = [];

    if (this.current() && this.current().type === "STRING") {
      children.push({
        type: "Text",
        value: this.eat("STRING").value
      });
      return { type: "Element", name, props, children };
    }
    if (this.current() && this.current().type === "LBRACE") {
      this.eat("LBRACE");

      while (this.current() && this.current().type !== "RBRACE") {
        children.push(this.parseElement());
      }

      this.eat("RBRACE");
    }

    return { type: "Element", name, props, children };
  }
}

class CodeGenerator {
  generate(node) {
    switch (node.type) {
      case "Program":
        return node.body.map(n => this.generate(n)).join("\n");

      case "Element":
        if (node.name === "StyleSheet") {
          return this.generateStyleSheet(node);
        }
        return this.generateElement(node);

      case "Text":
        return this.transformText(node.value);
    }
  }

  transformText(text) {
    if (text.includes("{")) {
      return `\`${text.replace(/\{(.*?)\}/g, "${$1}")}\``;
    }
    return `"${text}"`;
  }

  generateStyleSheet(node) {
  const styles = {};
  for (const child of node.children) {
    const key = child.name;
    styles[key] = {};
    for (const prop in child.props) {
      const val = child.props[prop];
      if (typeof val === "string" && val.startsWith("{") && val.endsWith("}")) {
        styles[key][prop] = val.slice(1, -1);
      } else {
        styles[key][prop] = val;
      }
    }
  }
  return JSON.stringify(styles, null, 2);
}

  generateElement(node) {
    const mappedTag = viewTags[node.name] || node.name;

    const propsParts = [];
    for (const key in node.props) {
      const value = node.props[key];
      if (value === true) propsParts.push(`${key}: true`);
      else if (typeof value === "string" && value.startsWith("{") && value.endsWith("}"))
        propsParts.push(`${key}: ${value.slice(1, -1)}`);
      else propsParts.push(`${key}: ${JSON.stringify(value)}`);
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
