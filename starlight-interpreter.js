const viewMap = {
  SLLink: "a",
  SLAbbreviation: "abbr",
  SLAddressView: "address",
  SLMapArea: "area",
  SLArticleView: "article",
  SLAsideView: "aside",
  SLAudioPlayer: "audio",
  SLBoldText: "b",
  SLBaseConfig: "base",
  SLBdiView: "bdi",
  SLBdoView: "bdo",
  SLQuoteView: "blockquote",
  SLBodyView: "body",
  SLLineBreak: "br",
  SLButton: "button",
  SLCanvasView: "canvas",
  SLCaptionView: "caption",
  SLCiteView: "cite",
  SLCodeView: "code",
  SLColumnView: "col",
  SLColumnGroup: "colgroup",
  SLDataView: "data",
  SLDataListView: "datalist",
  SLDescriptionView: "dd",
  SLDeleteView: "del",
  SLDetailsView: "details",
  SLDefinitionView: "dfn",
  SLDialogView: "dialog",
  SLContainerView: "div",
  SLDescriptionList: "dl",
  SLDescriptionTerm: "dt",
  SLEmphasisText: "em",
  SLEmbedView: "embed",
  SLFieldSet: "fieldset",
  SLFigCaption: "figcaption",
  SLFigureView: "figure",
  SLFooterView: "footer",
  SLFormView: "form",
  SLHeader1: "h1",
  SLHeader2: "h2",
  SLHeader3: "h3",
  SLHeader4: "h4",
  SLHeader5: "h5",
  SLHeader6: "h6",
  SLHeadView: "head",
  SLHeaderView: "header",
  SLDivider: "hr",
  SLHtmlRoot: "html",
  SLItalicText: "i",
  SLIFrameView: "iframe",
  SLImageView: "img",
  SLInputView: "input",
  SLInsertView: "ins",
  SLKeyboardView: "kbd",
  SLLabelView: "label",
  SLLegendView: "legend",
  SLListItem: "li",
  SLLinkTag: "link",
  SLMainView: "main",
  SLMapView: "map",
  SLMarkView: "mark",
  SLMetaTag: "meta",
  SLMeterView: "meter",
  SLNavView: "nav",
  SLNoScriptView: "noscript",
  SLObjectView: "object",
  SLOrderedList: "ol",
  SLOptGroup: "optgroup",
  SLOptionView: "option",
  SLOutputView: "output",
  SLTextView: "p",
  SLParamView: "param",
  SLPictureView: "picture",
  SLPreformattedText: "pre",
  SLProgressView: "progress",
  SLQuoteInline: "q",
  SLRubyParenthesis: "rp",
  SLRubyText: "rt",
  SLRubyView: "ruby",
  SLStrikethroughText: "s",
  SLSampleText: "samp",
  SLScriptView: "script",
  SLSectionView: "section",
  SLSelectView: "select",
  SLSmallText: "small",
  SLSourceView: "source",
  SLSpanView: "span",
  SLStrongText: "strong",
  SLStyleView: "style",
  SLSubText: "sub",
  SLSummaryView: "summary",
  SLSuperText: "sup",
  SLTableView: "table",
  SLTableBody: "tbody",
  SLTableCell: "td",
  SLTemplateView: "template",
  SLTextAreaView: "textarea",
  SLTableFooter: "tfoot",
  SLTableHeaderCell: "th",
  SLTableHeader: "thead",
  SLTimeView: "time",
  SLTitleView: "title",
  SLTableRow: "tr",
  SLTrackView: "track",
  SLUnderlineText: "u",
  SLUnorderedList: "ul",
  SLVariableText: "var",
  SLVideoPlayer: "video",
  SLWordBreak: "wbr"
};

export function SL(type, props = {}, ...children) {
  return { type, props, children };
}

export const StyleSheet = {
  create(styles) {
    return styles;
  }
};

function renderNode(node) {
  if (typeof node === "string" || typeof node === "number") {
    return document.createTextNode(node);
  }

  if (typeof node.type === "function") {
    return renderNode(node.type(node.props || {}));
  }

  const tag = viewMap[node.type] || "div";
  const el = document.createElement(tag);

  for (let key in (node.props || {})) {
    const value = node.props[key];

    if (key === "customize") { // <-- changed from "style"
      Object.assign(el.style, value);
    } else if (key.startsWith("on")) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }

  (node.children || []).forEach(child => {
    el.appendChild(renderNode(child));
  });

  return el;
}

export function render(app, container) {
  container.innerHTML = "";
  container.appendChild(renderNode(app));
}

let stateStore = [];
let stateIndex = 0;
let rootApp, rootContainer;

export function useState(initial) {
  const i = stateIndex;

  if (stateStore[i] === undefined) {
    stateStore[i] = initial;
  }

  function setState(val) {
    stateStore[i] = val;
    rerender();
  }

  stateIndex++;
  return [stateStore[i], setState];
}

export function run(App, container) {
  rootApp = App;
  rootContainer = container;
  rerender();
}

function rerender() {
  stateIndex = 0;
  render(SL(rootApp), rootContainer);
}
