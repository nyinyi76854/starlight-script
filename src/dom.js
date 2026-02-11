// src/dom.js

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
