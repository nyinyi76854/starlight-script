// src/index.js
window.Starlight = window.Starlight || {};

class StarlightElement extends HTMLElement {
  connectedCallback() {
    const code = this.textContent;
    this.textContent = ""; // clear original code
    Starlight.Runtime.run(code, this);
  }
}

// Register the custom element
customElements.define('starlight', StarlightElement);
