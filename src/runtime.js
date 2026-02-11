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
