// src/core.js

(function (global) {

  // Reactive state wrapper
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

  // Execute compiled JS code
  function execute(code, context = {}) {
    const keys = Object.keys(context)
    const values = Object.values(context)

    const func = new Function(...keys, code)
    return func(...values)
  }

  // Mount Starlight code to DOM
  function mount(selector, code, context = {}) {
    const container = typeof selector === "string" ? document.querySelector(selector) : selector

    if (!container) {
      throw new Error("Mount target not found: " + selector)
    }

    try {
      // 1. Tokenize
      const tokens = StarlightLexer.tokenize(code)

      // 2. Parse
      const ast = StarlightParser(tokens)

      // 3. Compile
      const jsCode = StarlightCompiler.compile(ast)

      // 4. Execute with DOM + reactive state
      context.DOM = DOM
      context.reactive = reactive

      const root = execute(jsCode, context)

      // 5. Mount returned element or fragment
      if (root) DOM.mount(container, root)
    } catch (e) {
      console.error("Starlight Core Error:", e)
      container.innerHTML = "<pre style='color:red'>" + e.stack + "</pre>"
    }
  }

  // Allow evaluating code dynamically
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

  // Helper: auto-mount <starlight> tags in HTML
  function mountAll() {
    const elements = document.querySelectorAll("starlight")
    elements.forEach(el => {
      const code = el.textContent
      mount(el, code)
    })
  }

  // Expose global Starlight object
  global.Starlight = {
    reactive,
    mount,
    eval: evalCode,
    mountAll
  }

  // Auto-mount when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll)
  } else {
    mountAll()
  }

})(window)
