let activeEffect = null;

export function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  function getter() {
    if (activeEffect) subscribers.add(activeEffect);
    return value;
  }

  function setter(newValue) {
    if (typeof newValue === "function") {
      value = newValue(value);
    } else {
      value = newValue;
    }

    subscribers.forEach(effect => effect());

    if (currentComponent && currentComponent.update) {
      currentComponent.update();
    }
  }

  return [getter, setter];
}


export function effect(fn) {
  activeEffect = fn;
  fn();               
  activeEffect = null;
}

let currentComponent = null;

export function useState(initial) {
  if (!currentComponent) {
    throw new Error("useState must be called inside a component");
  }

  const component = currentComponent;

  if (component.stateIndex === undefined) component.stateIndex = 0;
  if (!component.state) component.state = [];

  const index = component.stateIndex++;

  if (!component.state[index]) {
    const [get, set] = signal(initial);

    const wrappedSetter = (value) => {
      set(value);
      if (component.update) {
        component.update();
      }
    };

    component.state[index] = [get, wrappedSetter];
  }

  return component.state[index];
}
export function createElement(type, props, ...children) {
  return {
    type,
    props: props || {},
    children: children.flat()
  };
}
export function mountComponent(vnode) {
  const prevComponent = currentComponent;

  const component = {
    vnode,
    state: [],
    stateIndex: 0,
    effects: [],
    dom: null,
    parent: null
  };

  function update() {
    component.stateIndex = 0;

    const prevVNode = component.vnode._rendered;
    const newVNode = vnode.type(vnode.props || {});

    component.vnode._rendered = newVNode;

    const newDom = renderElement(newVNode);

    if (component.dom && component.parent) {
      component.parent.replaceChild(newDom, component.dom);
    }

    component.dom = newDom;
  }

  component.update = update;

  currentComponent = component;

  const renderedVNode = vnode.type(vnode.props || {});
  component.vnode._rendered = renderedVNode;

  const dom = renderElement(renderedVNode);

  component.dom = dom;

  setTimeout(() => {
    component.parent = dom.parentNode;
  });

  currentComponent = prevComponent;

  return dom;
}

export function renderElement(vnode) {
  if (vnode == null || vnode === false || vnode === true) {
    return document.createTextNode("");
  }

  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(String(vnode));
  }

  if (typeof vnode.type === "function") {
    return mountComponent(vnode);
  }

  const dom = document.createElement(vnode.type);

  if (vnode.props) {
    for (let key in vnode.props) {
      const value = vnode.props[key];

      if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        dom.addEventListener(eventName, value);
      }
      else if (key === "style" && typeof value === "object") {
        Object.assign(dom.style, value);
      }

      else if (key === "className") {
        dom.setAttribute("class", value);
      }

      else if (key !== "children") {
        dom.setAttribute(key, value);
      }
    }
  }

  if (vnode.children) {
    const children = vnode.children.flat
      ? vnode.children.flat(Infinity)
      : vnode.children;

    children.forEach(child => {
      dom.appendChild(renderElement(child));
    });
  }

  return dom;
}


function setProps(dom, props) {
  for (let key in props) {
    if (!props.hasOwnProperty(key)) continue;
    const value = props[key];

    if (key === "style" && typeof value === "object") {
      Object.assign(dom.style, value);
    } else if (key.startsWith("on") && typeof value === "function") {
      const event = key.slice(2).toLowerCase();
      dom.addEventListener(event, value);
    } else {
      dom.setAttribute(key, value);
    }
  }
}

function diff(parent, newVNode, oldVNode, index = 0) {
  if (!oldVNode) {
    parent.appendChild(renderElement(newVNode));
    return;
  }

  if (!newVNode) {
    parent.removeChild(parent.childNodes[index]);
    return;
  }

  if (changed(newVNode, oldVNode)) {
    parent.replaceChild(
      renderElement(newVNode),
      parent.childNodes[index]
    );
    return;
  }

  if (newVNode.type) {
    const newChildren = newVNode.children || [];
    const oldChildren = oldVNode.children || [];
    const maxLength = Math.max(newChildren.length, oldChildren.length);

    for (let i = 0; i < maxLength; i++) {
      diff(
        parent.childNodes[index],
        newChildren[i],
        oldChildren[i],
        i
      );
    }
  }
}

function changed(a, b) {
  if (typeof a !== typeof b) return true;

  if (typeof a === "string" || typeof a === "number") {
    return a !== b;
  }

  return a.type !== b.type;
}
const routes = {};

export function registerRoute(path, component) {
  routes[path] = component;
}

export function Router() {
  const [getPath, setPath] = signal(window.location.pathname);

  window.addEventListener("popstate", () => {
    setPath(window.location.pathname);
  });

  const Component = routes[getPath()] || routes["/"];
  return createElement(Component, {});
}

export function navigate(path) {
  history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}

export function renderToString(vnode) {
  if (typeof vnode === "string" || typeof vnode === "number") return vnode;

  if (typeof vnode.type === "function") {
    return renderToString(vnode.type(vnode.props));
  }

  const propsString = Object.entries(vnode.props || {})
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

  const childrenString = (vnode.children || [])
    .map(renderToString)
    .join("");

  return `<${vnode.type} ${propsString}>${childrenString}</${vnode.type}>`;
}

export function hydrate(vnode, container) {
  container.replaceWith(renderElement(vnode));
}

if (import.meta && import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log("Hot reload triggered");
    location.reload();
  });
}


export function defineComponent(component, types = {}) {
  component.__types = types;
  return component;
}
class DSLCompiler {

  compile(template) {

    let transformed = template.replace(/\{(.*?)\}/g, "${$1}");

    transformed = "`" + transformed + "`";

    return transformed;
  }
}

export class Builder {

  static bundle(entry) {
    console.log("Bundling:", entry);
    return entry; 
  }

  static devServer(port = 3000) {
    console.log("Dev server running at http://localhost:" + port);
  }
}



export function render(app, container) {
  const dom = renderElement(app);
  container.innerHTML = "";
  container.appendChild(dom);
}
const componentCleanupMap = new WeakMap();

export function useEffect(callback, deps = []) {
  const component = currentComponent;
  if (!component) return;

  const prevDeps = component.lastDeps || [];
  let hasChanged = deps.length !== prevDeps.length || deps.some((d, i) => d !== prevDeps[i]);

  if (hasChanged) {
    callback();
    component.lastDeps = deps;
  }
}

export function useLayoutEffect(callback, deps = []) {
  requestAnimationFrame(() => useEffect(callback, deps));
}

export function useCleanup(callback) {
  const component = currentComponent;
  if (!component) return;

  if (!componentCleanupMap.has(component)) {
    componentCleanupMap.set(component, []);
  }

  componentCleanupMap.get(component).push(callback);
}

function runCleanup(component) {
  const cleanups = componentCleanupMap.get(component) || [];
  cleanups.forEach(fn => fn());
  componentCleanupMap.delete(component);
}

export function useAnimation(initialValue) {
  const [value, setValue] = useState(initialValue);
  return [value, setValue];
}

export function animate(element, props, options = {}) {
  if (!element) return;
  const { duration = 300, easing = "linear" } = options;
  Object.keys(props).forEach(key => {
    element.style.transition = `${key} ${duration}ms ${easing}`;
    element.style[key] = props[key];
  });
}

export function useGesture(handler) {
  const component = currentComponent;
  if (!component) return;

  const gestureListener = event => handler(event);
  if (!component.gestureListeners) component.gestureListeners = [];
  component.gestureListeners.push(gestureListener);

  setTimeout(() => {
    if (component.dom) {
      component.gestureListeners.forEach(fn => component.dom.addEventListener("pointerdown", fn));
    }
  }, 0);
}

export function Fragment({ children }) {
  return children; 
}

export function Portal({ children, container }) {
  if (!container) container = document.body;
  children.flat().forEach(child => container.appendChild(renderElement(child)));
  return null;
}

export function Suspense({ fallback, children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  let resolvedChildren = [];

  Promise.resolve(children).then(res => {
    resolvedChildren = Array.isArray(res) ? res : [res];
    setIsLoaded(true);
  });

  return isLoaded ? resolvedChildren : fallback ? [fallback] : null;
}
export function lazy(importFn) {
  let LoadedComponent = null;

  return async function LazyComponent(props) {
    if (!LoadedComponent) {
      const module = await importFn();
      LoadedComponent = module.default || module;
    }
    return createElement(LoadedComponent, props);
  };
}
export function createContext(defaultValue) {
  return {
    _currentValue: defaultValue,
    Provider: function Provider({ value, children }) {
      this._currentValue = value;
      return children;
    }
  };
}

export function useContext(context) {
  return context._currentValue;
}

export function cloneElement(element, props = {}, ...children) {
  return createElement(
    element.type,
    { ...element.props, ...props },
    ...(children.length ? children : element.children)
  );
}

export function isValidElement(obj) {
  return obj && obj.type && obj.props;
}

export function mergeProps(defaultProps, props) {
  return { ...defaultProps, ...props };
}
export function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  window.addEventListener("resize", () => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  });

  return dimensions;
}

export function useOrientation() {
  const { width, height } = useWindowDimensions();
  return width > height ? "landscape" : "portrait";
}

export const Platform = {
  OS: navigator.userAgent.includes("Android")
    ? "android"
    : navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")
    ? "ios"
    : "web",
  isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
};

export function StyleSheet(styles) {
  const processed = {};
  for (let key in styles) {
    processed[key] = styles[key];
  }
  return processed;
}

export function useRoute() {
  const [path] = signal(window.location.pathname);
  return { path };
}

export function useNavigation() {
  return {
    navigate: (path) => {
      history.pushState({}, "", path);
      window.dispatchEvent(new Event("popstate"));
    }
  };
}

export function StackNavigator({ routes, initialRoute = "/" }) {
  const [stack, setStack] = useState([initialRoute]);

  function push(route) {
    setStack([...stack[0] ? stack : [], route]);
    history.pushState({}, "", route);
    window.dispatchEvent(new Event("popstate"));
  }

  function pop() {
    if (stack.length > 1) {
      stack.pop();
      setStack([...stack]);
      history.pushState({}, "", stack[stack.length - 1]);
      window.dispatchEvent(new Event("popstate"));
    }
  }

  const CurrentComponent = routes[stack[stack.length - 1]];

  return createElement(CurrentComponent, { push, pop });
}

export function TabNavigator({ routes, initialTab = Object.keys(routes)[0] }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  function switchTab(tabName) {
    if (routes[tabName]) setActiveTab(tabName);
  }

  const ActiveComponent = routes[activeTab];

  return createElement("div", {},
    createElement("nav", {},
      Object.keys(routes).map(tab =>
        createElement("button", { onClick: () => switchTab(tab) }, tab)
      )
    ),
    createElement(ActiveComponent, {})
  );
}
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  effect(() => {
    setLoading(true);
    fetch(url, options)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  });

  return { data: data[0](), loading: loading[0](), error: error[0]() };
}

export function useResource(fetchFn) {
  const [resource, setResource] = useState(null);

  effect(async () => {
    const result = await fetchFn();
    setResource(result);
  });

  return resource[0]();
}

export function createStore(initialState = {}) {
  const store = {};
  const signals = {};

  for (let key in initialState) {
    const [getter, setter] = signal(initialState[key]);
    signals[key] = { get: getter, set: setter };
    Object.defineProperty(store, key, {
      get: getter,
      set: setter
    });
  }

  return store;
}

export function useDebug(name, state) {
  effect(() => {
    console.log(`[Starlight Debug] ${name}:`, state);
  });
}

export function DevTools({ store }) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.right = "0";
  container.style.top = "0";
  container.style.backgroundColor = "rgba(0,0,0,0.7)";
  container.style.color = "#fff";
  container.style.padding = "10px";
  container.style.fontFamily = "monospace";
  container.style.zIndex = 9999;

  document.body.appendChild(container);

  effect(() => {
    container.innerHTML = "";
    for (let key in store) {
      const value = typeof store[key] === "function" ? store[key]() : store[key];
      const line = document.createElement("div");
      line.textContent = `${key}: ${JSON.stringify(value)}`;
      container.appendChild(line);
    }
  });

  return container;
}
export function SuspenseBoundary({ fallback, children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  let resolvedChildren = [];

  Promise.resolve(children).then(res => {
    resolvedChildren = Array.isArray(res) ? res : [res];
    setIsLoaded(true);
  });

  return isLoaded ? resolvedChildren : fallback ? [fallback] : null;
}

export function Link({ to, children, ...props }) {
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };

  return createElement("a", { href: to, onClick: handleClick, ...props }, children);
}

export function Redirect({ to }) {
  navigate(to);
  return null;
}

export function useParams(pattern = "/:id") {
  const [path] = signal(window.location.pathname);
  const keys = [];
  const regexStr = pattern.replace(/:([a-zA-Z]+)/g, (_, key) => {
    keys.push(key);
    return "([^/]+)";
  });
  const regex = new RegExp(`^${regexStr}$`);
  const match = path().match(regex);
  const params = {};
  if (match) {
    keys.forEach((key, i) => {
      params[key] = match[i + 1];
    });
  }
  return params;
}

export function useQuery() {
  const [search] = signal(window.location.search);
  const query = {};
  const params = new URLSearchParams(search());
  params.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}
export function spring(value, { stiffness = 0.1, damping = 0.8 } = {}) {
  const [val, setVal] = useState(value);

  function animateTo(target) {
    let velocity = 0;
    function step() {
      const displacement = target - val()[0]();
      velocity = velocity * damping + displacement * stiffness;
      const next = val()[0]() + velocity;
      setVal(next);
      if (Math.abs(next - target) > 0.01 || Math.abs(velocity) > 0.01) {
        requestAnimationFrame(step);
      }
    }
    step();
  }

  return [val, animateTo];
}

export function transition(element, fromProps, toProps, { duration = 300, easing = "linear" } = {}) {
  if (!element) return;
  Object.assign(element.style, fromProps);
  setTimeout(() => {
    Object.assign(element.style, {
      transition: `all ${duration}ms ${easing}`,
      ...toProps
    });
  }, 0);
}

export function useTransition(items, keyFn, { enter, leave }) {
  const [state, setState] = useState(items);

  effect(() => {
    const prev = state()[0] || [];
    const entering = items.filter(i => !prev.includes(i));
    const leaving = prev.filter(i => !items.includes(i));

    entering.forEach(item => enter && enter(item));
    leaving.forEach(item => leave && leave(item));

    setState(items);
  });

  return state[0]();
}
export function useForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues);

  function handleChange(name, value) {
    setValues({ ...values[0](), [name]: value });
  }

  return { values: values[0](), setValues, handleChange };
}

export function useField(name, form) {
  const value = form.values[name] || "";
  function onChange(e) {
    form.handleChange(name, e.target.value);
  }
  return { value, onChange };
}

export function Form({ children, onSubmit, ...props }) {
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit && onSubmit(e);
  }
  return createElement("form", { ...props, onSubmit: handleSubmit }, children);
}

export function Input({ name, form, ...props }) {
  const field = useField(name, form);
  return createElement("input", { ...props, name, value: field.value, onInput: field.onChange });
}

export function TextArea({ name, form, ...props }) {
  const field = useField(name, form);
  return createElement("textarea", { ...props, name, value: field.value, onInput: field.onChange });
}

export function Select({ name, form, options = [], ...props }) {
  const field = useField(name, form);
  return createElement("select", { ...props, name, value: field.value, onChange: field.onChange },
    options.map(opt => createElement("option", { value: opt.value || opt }, opt.label || opt))
  );
}
export function memo(component, compare = (prev, next) => prev === next) {
  let lastProps = null;
  let lastResult = null;

  return function MemoComponent(props) {
    if (!lastProps || !compare(lastProps, props)) {
      lastResult = component(props);
      lastProps = props;
    }
    return lastResult;
  };
}

export function forwardRef(component) {
  return function Forwarded(props) {
    return component({ ...props, ref: props.ref });
  };
}

export function useRef(initial) {
  const [ref] = useState({ current: initial });
  return ref;
}
export function ErrorBoundary({ fallback, children }) {
  try {
    return children;
  } catch (err) {
    console.error("[Starlight ErrorBoundary]", err);
    return fallback ? [fallback] : null;
  }
}
export function renderToNodeStream(vnode) {
  const readableStream = new ReadableStream({
    start(controller) {
      const html = renderToString(vnode);
      controller.enqueue(new TextEncoder().encode(html));
      controller.close();
    }
  });
  return readableStream;
}

export function hydrateRoot(vnode, container) {
  container.innerHTML = renderToString(vnode);
  hydrate(vnode, container);
}
export function Profiler({ id, onRender, children }) {
  const start = performance.now();
  const result = children;
  const end = performance.now();
  onRender && onRender(id, end - start);
  return result;
}

export function useLogger(name, value) {
  effect(() => {
    console.log(`[Starlight Logger] ${name}:`, value);
  });
}

export function DevInspector() {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.bottom = "0";
  container.style.right = "0";
  container.style.width = "300px";
  container.style.height = "300px";
  container.style.overflow = "auto";
  container.style.background = "rgba(0,0,0,0.8)";
  container.style.color = "#fff";
  container.style.fontFamily = "monospace";
  container.style.zIndex = 9999;
  container.style.padding = "10px";
  container.style.fontSize = "12px";
  document.body.appendChild(container);

  function renderTree() {
    container.innerHTML = "<strong>Starlight DevInspector</strong><br/>";
    document.querySelectorAll("*").forEach(el => {
      const div = document.createElement("div");
      div.textContent = `<${el.tagName.toLowerCase()}>`;
      div.style.cursor = "pointer";
      div.onclick = () => console.log("Element:", el, "Props:", el.props || {});
      container.appendChild(div);
    });
  }

  setInterval(renderTree, 1000);
  return container;
}
export function batch(fn) {
  const prevEffect = activeEffect;
  activeEffect = null;
  fn();
  activeEffect = prevEffect;
}

export function nextTick(fn) {
  Promise.resolve().then(fn);
}

export const isServer = typeof window === "undefined";
export const isClient = !isServer;
export function SuspenseList({ children, revealOrder = "forwards", fallback = null }) {
  const renderedChildren = [];
  const len = children.length;

  if (revealOrder === "forwards") {
    for (let i = 0; i < len; i++) {
      const child = children[i];
      renderedChildren.push(
        createElement(SuspenseBoundary, { fallback }, child)
      );
    }
  } else if (revealOrder === "backwards") {
    for (let i = len - 1; i >= 0; i--) {
      const child = children[i];
      renderedChildren.unshift(
        createElement(SuspenseBoundary, { fallback }, child)
      );
    }
  } else {
    children.forEach(child => {
      renderedChildren.push(createElement(SuspenseBoundary, { fallback }, child));
    });
  }

  return renderedChildren;
}

export function lazyWithPreload(factory) {
  let component = null;
  let loaded = false;

  function load() {
    if (!loaded) {
      component = factory();
      loaded = true;
    }
    return component;
  }

  const LazyComponent = (props) => {
    if (!loaded) {
      throw load(); 
    }
    return createElement(component, props);
  };

  LazyComponent.preload = load;

  return LazyComponent;
}
export function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);

  function dispatch(action) {
    setState(prev => reducer(prev, action));
  }

  return [state, dispatch];
}

export function useStore(store) {
  const [_, setTick] = useState(0);

  effect(() => {
    for (let key in store) store[key];
    setTick(t => t + 1);
  });

  return store;
}

export function useSpring(initial, { stiffness = 0.1, damping = 0.8 } = {}) {
  const [value, setValue] = useState(initial);

  function animateTo(target) {
    let velocity = 0;
    function step() {
      const current = value()[0]();
      const displacement = target - current;
      velocity = velocity * damping + displacement * stiffness;
      const next = current + velocity;
      setValue(next);
      if (Math.abs(next - target) > 0.01 || Math.abs(velocity) > 0.01) {
        requestAnimationFrame(step);
      }
    }
    step();
  }

  return [value, animateTo];
}

export function useTransitionGroup(items, keyFn, { enter, leave }) {
  const [state, setState] = useState(items);

  effect(() => {
    const prev = state()[0] || [];
    const entering = items.filter(i => !prev.includes(i));
    const leaving = prev.filter(i => !items.includes(i));

    entering.forEach(item => enter && enter(item));
    leaving.forEach(item => leave && leave(item));

    setState(items);
  });

  return state[0]();
}

export function useDrag(handler) {
  function onMouseDown(e) {
    const startX = e.clientX;
    const startY = e.clientY;

    function onMouseMove(ev) {
      handler({ type: "drag", dx: ev.clientX - startX, dy: ev.clientY - startY });
    }

    function onMouseUp(ev) {
      handler({ type: "end", dx: ev.clientX - startX, dy: ev.clientY - startY });
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    handler({ type: "start", dx: 0, dy: 0 });
  }

  return { onMouseDown };
}

export function useSwipe(handler, threshold = 50) {
  let startX = 0;
  let startY = 0;

  function onTouchStart(e) {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
  }

  function onTouchEnd(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      handler({ dx, dy });
    }
  }

  return { onTouchStart, onTouchEnd };
}
export function useImperativeHandle(ref, create) {
  if (ref && typeof ref === "object") {
    ref.current = create();
  }
}

export function lazyComponentWrapper(factory, fallback = null) {
  const LazyComp = lazyWithPreload(factory);
  return (props) => createElement(SuspenseBoundary, { fallback }, createElement(LazyComp, props));
}

export function withErrorBoundary(Component, fallback = null) {
  return (props) => createElement(ErrorBoundary, { fallback }, createElement(Component, props));
}
export function renderToStaticMarkup(vnode) {
  if (typeof vnode === "string") return vnode;

  if (typeof vnode.type === "function") {
    return renderToStaticMarkup(vnode.type(vnode.props));
  }

  const propsString = Object.entries(vnode.props || {})
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

  const children = vnode.children
    .map(renderToStaticMarkup)
    .join("");

  return `<${vnode.type}${propsString ? " " + propsString : ""}>${children}</${vnode.type}>`;
}

export function hydrateStreaming(vnode, container) {
  const stream = renderToNodeStream(vnode);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let html = "";

  function push() {
    reader.read().then(({ done, value }) => {
      if (done) {
        container.innerHTML = html;
        hydrate(vnode, container);
        return;
      }
      html += decoder.decode(value);
      push();
    });
  }

  push();
}
export function traceUpdates() {
  const style = document.createElement("style");
  style.innerHTML = `
    ._starlight-update { outline: 2px solid red; }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.type === "childList") {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            node.classList.add("_starlight-update");
            setTimeout(() => node.classList.remove("_starlight-update"), 500);
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export function useProfiler(id, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[Starlight Profiler] ${id}: render took ${end - start}ms`);
  return result;
}
export function classNames(...args) {
  return args.flat().filter(Boolean).join(" ");
}

export function mergeStyles(...styles) {
  return Object.assign({}, ...styles);
}

export function composeRefs(...refs) {
  return (el) => {
    refs.forEach(ref => {
      if (!ref) return;
      if (typeof ref === "function") ref(el);
      else ref.current = el;
    });
  };
}
export function useHistory() {
  const push = (path) => {
    history.pushState({}, "", path);
    window.dispatchEvent(new Event("popstate"));
  };

  const replace = (path) => {
    history.replaceState({}, "", path);
    window.dispatchEvent(new Event("popstate"));
  };

  return { push, replace };
}

export function useLocation() {
  const [location, setLocation] = signal(window.location.pathname);

  window.addEventListener("popstate", () => {
    setLocation(window.location.pathname);
  });

  return location;
}

export function useMatch(pattern) {
  const path = useLocation();
  const regex = new RegExp("^" + pattern.replace(/:[^\s/]+/g, "([^/]+)") + "$");
  const match = path().match(regex);
  if (!match) return null;

  const keys = (pattern.match(/:[^\s/]+/g) || []).map(k => k.slice(1));
  const params = {};
  keys.forEach((key, i) => {
    params[key] = match[i + 1];
  });

  return { path: path(), params };
}

export function RedirectTo({ to }) {
  navigate(to);
  return null;
}
export function useMemo(factory, deps) {
  const component = currentComponent;
  const index = component.stateIndex++;

  if (!component.state[index]) {
    component.state[index] = { deps: undefined, value: undefined };
  }

  const record = component.state[index];

  let changed = !record.deps || !deps || deps.some((d, i) => d !== record.deps[i]);
  if (changed) {
    record.value = factory();
    record.deps = deps;
  }

  return record.value;
}

export function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
}

export function useDeferredValue(value) {
  const [deferred, setDeferred] = useState(value);

  nextTick(() => setDeferred(value));

  return deferred;
}

let globalId = 0;
export function useId() {
  const [id] = useState(() => `starlight-${globalId++}`);
  return id;
}
export function motion(type) {
  return (props) => {
    const { animate: animationProps, ...rest } = props;
    const dom = createElement(type, rest);

    effect(() => {
      if (animationProps) animate(dom, animationProps);
    });

    return dom;
  };
}

export function AnimatePresence({ children, enter, exit }) {
  const [rendered, setRendered] = useState(children);

  effect(() => {
    const prev = rendered()[0] || [];
    const entering = children.filter(c => !prev.includes(c));
    const leaving = prev.filter(c => !children.includes(c));

    entering.forEach(c => enter && enter(c));
    leaving.forEach(c => exit && exit(c));

    setRendered(children);
  });

  return rendered()[0] ? rendered()[0] : null;
}
export function catchError(fn, fallback) {
  try {
    return fn();
  } catch (err) {
    console.error("[Starlight Error]", err);
    if (fallback) return fallback(err);
    return null;
  }
}

const globalErrorHandlers = new Set();
export function onError(handler) {
  globalErrorHandlers.add(handler);
}
window.addEventListener("error", (e) => {
  globalErrorHandlers.forEach(h => h(e.error));
});
window.addEventListener("unhandledrejection", (e) => {
  globalErrorHandlers.forEach(h => h(e.reason));
});
export function useValidator(rules) {
  const [errors, setErrors] = useState({});

  function validate(values) {
    const newErrors = {};
    for (let key in rules) {
      const rule = rules[key];
      const value = values[key];
      const result = rule(value);
      if (result !== true) newErrors[key] = result;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  return [errors, validate];
}

export function Controller({ name, control, render }) {
  const [value, setValue] = control[name];
  return render({ value: value(), onChange: v => setValue(v) });
}
export function traceRenders(componentName) {
  effect(() => {
    console.log(`[Starlight Render] ${componentName} rendered`);
  });
}

export function useInspector() {
  const [inspected, setInspected] = useState(null);

  window.addEventListener("click", (e) => {
    setInspected(e.target);
    console.log("[Starlight Inspector] Clicked Element:", e.target);
  });

  return inspected;
}
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  function update() {
    setInsets({
      top: window.visualViewport?.offsetTop || 0,
      bottom: window.innerHeight - (window.visualViewport?.height || window.innerHeight),
      left: window.visualViewport?.offsetLeft || 0,
      right: window.innerWidth - (window.visualViewport?.width || window.innerWidth)
    });
  }

  window.addEventListener("resize", update);
  update();

  return insets;
}

export function useKeyboard() {
  const [visible, setVisible] = useState(false);

  function onResize() {
    setVisible(window.innerHeight < window.visualViewport?.height);
  }

  window.addEventListener("resize", onResize);
  return visible;
}

export function Dimensions() {
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight });

  function onResize() {
    setDims({ width: window.innerWidth, height: window.innerHeight });
  }

  window.addEventListener("resize", onResize);

  return dims;
}
export function cloneVNode(vnode, props = {}, children = null) {
  return createElement(
    vnode.type,
    { ...vnode.props, ...props },
    children !== null ? children : vnode.children
  );
}

export function shallowEqual(objA, objB) {
  if (objA === objB) return true;
  if (!objA || !objB) return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }

  return true;
}

export function defer(fn) {
  if (typeof queueMicrotask === "function") queueMicrotask(fn);
  else if (typeof Promise !== "undefined") Promise.resolve().then(fn);
  else setTimeout(fn, 0);
}

export default {
  createElement,
  render,
  signal,
  mountComponent,
  renderElement,
  useState,
  effect,
  registerRoute,
  navigate,
  Router,
  renderToString,
  hydrate,
  defineComponent,
  Builder,
  useEffect,
  useLayoutEffect,
  useCleanup,
  useAnimation,
  animate,
  useGesture,
  Fragment,
  Portal,
  Suspense,
  lazy,
  createContext,
  useContext,
  cloneElement,
  isValidElement,
  mergeProps,
  useFetch,
  useResource,
  createStore,
  useDebug,
  DevTools,
  SuspenseBoundary,
  Link,
  Redirect,
  useParams,
  useQuery,
  spring,
  transition,
  useTransition,
  useForm,
  useField,
  Form,
  Input,
  TextArea,
  Select,
  memo,
  forwardRef,
  useRef,
  ErrorBoundary,
  renderToNodeStream,
  hydrateRoot,
  Profiler,
  useLogger,
  DevInspector,
  batch,
  nextTick,
  isServer,
  isClient,
  SuspenseList,
  lazyWithPreload,
  useReducer,
  useStore,
  useSpring,
  useTransitionGroup,
  useDrag,
  useSwipe,
  useImperativeHandle,
  lazyComponentWrapper,
  withErrorBoundary,
  renderToStaticMarkup,
  hydrateStreaming,
  traceUpdates,
  useProfiler,
  classNames,
  mergeStyles,
  composeRefs,
  useHistory,
  useLocation,
  useMatch,
  RedirectTo,
  useMemo,
  useCallback,
  useDeferredValue,
  useId,
  motion,
  AnimatePresence,
  catchError,
  onError,
  useValidator,
  Controller,
  traceRenders,
  useInspector,
  useSafeAreaInsets,
  useKeyboard,
  Dimensions,
  cloneVNode,
  shallowEqual,
  defer,
  StyleSheet
};
