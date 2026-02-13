// compiler-html.js
// Browser-ready ES module
// Compiles SL-style components to HTML using html-map.js

import htmlMap from './html-map.js';

/**
 * Recursively compiles a virtual SL element tree to HTML string.
 * Example input:
 * {
 *   type: "SLButton",
 *   props: { class: "btn", id: "myBtn" },
 *   children: ["Click me"]
 * }
 */
export function compileToHTML(slElement) {
  if (typeof slElement === 'string' || typeof slElement === 'number') {
    return slElement; // Text node
  }

  if (!slElement || !slElement.type) return '';

  // Map SL type to actual HTML tag
  const tag = htmlMap[slElement.type] || 'div';

  // Compile props to HTML attributes
  let attrs = '';
  if (slElement.props) {
    attrs = Object.entries(slElement.props)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case for HTML attributes
        const attrName = key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        return `${attrName}="${value}"`;
      })
      .join(' ');
    if (attrs) attrs = ' ' + attrs;
  }

  // Compile children recursively
  let childrenHTML = '';
  if (slElement.children && slElement.children.length) {
    childrenHTML = slElement.children.map(compileToHTML).join('');
  }

  // Self-closing tags
  const selfClosing = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
  ];
  if (selfClosing.includes(tag)) {
    return `<${tag}${attrs}>`;
  }

  return `<${tag}${attrs}>${childrenHTML}</${tag}>`;
}

/**
 * Compile an array of SL elements to full HTML string
 */
export function compileTreeToHTML(slTree) {
  if (Array.isArray(slTree)) {
    return slTree.map(compileToHTML).join('');
  }
  return compileToHTML(slTree);
}
