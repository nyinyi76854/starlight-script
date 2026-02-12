let activeEffect = null;

export function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  function getter() {
    if (activeEffect) subscribers.add(activeEffect);
    return value;
  }

  function setter(newValue) {
    value = newValue;
    subscribers.forEach(effect => effect());
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
  const component = currentComponent;
  const index = component.stateIndex++;

  if (!component.state[index]) {
    component.state[index] = signal(initial);
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
function setProps(dom, props) {
  for (let key in props) {
    if (key.startsWith("on")) {
      const event = key.slice(2).toLowerCase();
      dom.addEventListener(event, props[key]);
    } else {
      dom.setAttribute(key, props[key]);
    }
  }
}

function renderElement(vnode) {
  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(vnode);
  }

  if (typeof vnode.type === "function") {
    return mountComponent(vnode);
  }

  const dom = document.createElement(vnode.type);
  setProps(dom, vnode.props);

  vnode.children.forEach(child => {
    dom.appendChild(renderElement(child));
  });

  return dom;
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
    const newLength = newVNode.children.length;
    const oldLength = oldVNode.children.length;

    for (let i = 0; i < newLength || i < oldLength; i++) {
      diff(
        parent.childNodes[index],
        newVNode.children[i],
        oldVNode.children[i],
        i
      );
    }
  }
}

function changed(a, b) {
  return (
    typeof a !== typeof b ||
    (typeof a === "string" && a !== b) ||
    a.type !== b.type
  );
}
function mountComponent(vnode) {
  const componentInstance = {
    state: [],
    stateIndex: 0,
    vnode,
    dom: null
  };

  currentComponent = componentInstance;
  componentInstance.stateIndex = 0;

  const renderedVNode = vnode.type(vnode.props);

  const dom = renderElement(renderedVNode);
  componentInstance.dom = dom;

  effect(() => {
    const newVNode = vnode.type(vnode.props);
    diff(dom.parentNode, newVNode, renderedVNode);
  });

  currentComponent = null;

  return dom;
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
  if (typeof vnode === "string") return vnode;

  if (typeof vnode.type === "function") {
    return renderToString(vnode.type(vnode.props));
  }

  const propsString = Object.entries(vnode.props)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

  const children = vnode.children
    .map(renderToString)
    .join("");

  return `<${vnode.type} ${propsString}>${children}</${vnode.type}>`;
}

export function hydrate(vnode, container) {
  const dom = renderElement(vnode);
  container.replaceWith(dom);
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

export function Provider({ context, value, children }) {
  context._currentValue = value;
  return children;
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

export function Provider({ context, value, children }) {
  context._currentValue = value;
  return children;
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

export default {
  createElement,
  render,
  signal,
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
  Provider,
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
  Provider,
  useSpring,
  useTransitionGroup,
  useDrag,
  useSwipe,
  useImperativeHandle,
  lazyComponentWrapper,
  withErrorBoundary


};
