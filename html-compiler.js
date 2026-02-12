const viewTags = {
  html: "UIContainer",
  body: "UIContainer",
  div: "UIContainer",
  section: "UIContainer",
  header: "UIHeader",
  footer: "UIFooter",
  article: "UIArticle",
  aside: "UISidebar",
  nav: "UINavigation",
  ul: "UIList",
  ol: "UIList",
  li: "UIListItem",
  span: "UILabel",
  p: "UILabel",
  h1: "UITitle",
  h2: "UISubtitle",
  h3: "UILabel",
  h4: "UILabel",
  h5: "UILabel",
  h6: "UILabel",
  button: "UIButton",
  input: "UITextField",
  textarea: "UITextArea",
  select: "UIDropdown",
  option: "UIOption",
  checkbox: "UICheckbox",
  radio: "UIRadioButton",
  form: "UIForm",
  label: "UILabel",
  fieldset: "UIFieldset",
  legend: "UILabel",
  datalist: "UIDataList",
  output: "UILabel",
  progress: "UIProgress",
  meter: "UIMeter",
  img: "UIImage",
  video: "UIVideo",
  audio: "UIAudio",
  table: "UITable",
  tr: "UITableRow",
  td: "UITableCell",
  th: "UITableCell",
  caption: "UILabel",
  a: "UILink",
  canvas: "UICanvas",
  svg: "UISVG",
  iframe: "UIFrame",
  picture: "UIPicture",
  map: "UIMap",
  area: "UIMapArea",
  object: "UIObject",
  embed: "UIEmbed",
  param: "UIParam",
  figure: "UIFigure",
  figcaption: "UILabel"
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
          /[a-zA-Z0-9_]/.test(this.input[this.position])
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

  eat(type) {
    const token = this.current();
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

    while (this.current() && this.current().type === "IDENTIFIER") {
      const key = this.eat("IDENTIFIER").value;
      this.eat("EQUALS");
      const valueToken = this.eat("IDENTIFIER") || this.eat("STRING");
      props[key] = valueToken.value;
    }

    let children = [];

    if (this.current() && this.current().type === "STRING") {
      const textValue = this.eat("STRING").value;
      children.push({ type: "Text", value: textValue });
      return { type: "Element", name, props, children };
    }

    if (this.current() && this.current().type === "LBRACE") {
      this.eat("LBRACE");
      while (this.current().type !== "RBRACE") {
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
        return this.generateElement(node);

      case "Text":
        return this.transformText(node.value);

      default:
        throw new Error("Unknown node type: " + node.type);
    }
  }

  transformText(text) {
    if (text.includes("{")) {
      const replaced = text.replace(/\{(.*?)\}/g, "${$1}");
      return `\`${replaced}\``; 
    } else {
      return `"${text}"`;
    }
  }

  generateElement(node) {
    const mappedTag = viewTags[node.name] || node.name;
    const propsString = JSON.stringify(node.props);
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
  return { type, props: props || {}, children: children.flat() };
}


export default HTMLCompiler;
