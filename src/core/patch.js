/**
 * @param {string} key
 * @returns {string}
 */
function toAttributeName(key) {
  return key === "className" ? "class" : key;
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isEventProp(key) {
  return typeof key === "string" && key.startsWith("on");
}

/**
 * @param {unknown} path
 * @returns {path is number[]}
 */
function isValidPath(path) {
  return (
    Array.isArray(path) &&
    path.every((index) => Number.isInteger(index) && index >= 0)
  );
}

/**
 * Cycle 1 TEXT 규칙 + className 매핑 규칙을 기준으로 최소 DOM 노드를 생성한다.
 * @param {any} vnode
 * @returns {Node}
 */
function createDOMNodeFromVNode(vnode) {
  if (!vnode || typeof vnode !== "object") {
    return document.createTextNode("");
  }

  const type = String(vnode.type ?? "");
  const props = vnode.props && typeof vnode.props === "object" ? vnode.props : {};
  const children = Array.isArray(vnode.children) ? vnode.children : [];

  if (type === "TEXT") {
    return document.createTextNode(String(props.nodeValue ?? ""));
  }

  const element = document.createElement(type);

  for (const [key, value] of Object.entries(props)) {
    if (key === "nodeValue") continue;
    if (isEventProp(key)) continue;
    if (typeof value === "undefined" || value === null) continue;
    element.setAttribute(toAttributeName(key), String(value));
  }

  for (const child of children) {
    element.appendChild(createDOMNodeFromVNode(child));
  }

  return element;
}

/**
 * path는 전달받은 rootEl 자체를 기준으로 탐색한다.
 * path=[] 인 경우 rootEl을 반환한다.
 * @param {Element} rootEl
 * @param {number[]} path
 * @returns {Node|null}
 */
export function getDOMNodeByPath(rootEl, path) {
  if (!rootEl || !isValidPath(path)) return null;

  let current = rootEl;
  for (const index of path) {
    if (!current.childNodes || index >= current.childNodes.length) return null;
    current = current.childNodes[index];
  }

  return current;
}

/**
 * @param {Element} rootEl
 * @param {number[]} path
 * @returns {Node|null}
 */
function getParentNodeByPath(rootEl, path) {
  if (!rootEl || !isValidPath(path)) return null;
  if (path.length === 0) return rootEl.parentNode;
  return getDOMNodeByPath(rootEl, path.slice(0, -1));
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applyCreatePatch(rootEl, patch) {
  if (!isValidPath(patch.path)) return;
  if (!patch.node || typeof patch.node !== "object") return;

  const path = patch.path;
  const vnode = patch.node;

  const newNode = createDOMNodeFromVNode(vnode);
  const parent = getParentNodeByPath(rootEl, path);
  if (!parent || !parent.childNodes || typeof parent.appendChild !== "function") return;

  if (path.length === 0) {
    // root 경로 CREATE는 rootEl의 다음 형제로 삽입한다.
    if (rootEl.parentNode && rootEl.nextSibling) {
      rootEl.parentNode.insertBefore(newNode, rootEl.nextSibling);
    } else if (rootEl.parentNode) {
      rootEl.parentNode.appendChild(newNode);
    }
    return;
  }

  const index = path[path.length - 1];
  const referenceNode = parent.childNodes[index] ?? null;
  if (referenceNode && typeof parent.insertBefore === "function") {
    parent.insertBefore(newNode, referenceNode);
  } else {
    parent.appendChild(newNode);
  }
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applyRemovePatch(rootEl, patch) {
  if (!isValidPath(patch.path)) return;
  const target = getDOMNodeByPath(rootEl, patch.path);

  if (target && target.parentNode) {
    target.parentNode.removeChild(target);
  }
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applyReplacePatch(rootEl, patch) {
  if (!isValidPath(patch.path)) return;
  if (!patch.node || typeof patch.node !== "object") return;

  const path = patch.path;
  const vnode = patch.node;

  const newNode = createDOMNodeFromVNode(vnode);
  const target = getDOMNodeByPath(rootEl, path);

  if (target && typeof target.replaceWith === "function") {
    target.replaceWith(newNode);
  }
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applyTextPatch(rootEl, patch) {
  if (!isValidPath(patch.path)) return;
  const target = getDOMNodeByPath(rootEl, patch.path);
  if (!target) return;

  const nextText = patch.text == null ? "" : String(patch.text);
  if (target.nodeType === 3) {
    target.nodeValue = nextText;
  } else {
    target.textContent = nextText;
  }
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applySetPropPatch(rootEl, patch) {
  if (!isValidPath(patch.path)) return;
  const target = getDOMNodeByPath(rootEl, patch.path);
  if (!target || target.nodeType !== 1) return;

  const key = patch.key;
  const value = patch.value;
  if (typeof key !== "string" || typeof value === "undefined" || value === null) return;
  if (isEventProp(key)) return;

  target.setAttribute(toAttributeName(key), String(value));
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applyRemovePropPatch(rootEl, patch) {
  if (!isValidPath(patch.path)) return;
  const target = getDOMNodeByPath(rootEl, patch.path);
  if (!target || target.nodeType !== 1) return;

  const key = patch.key;
  if (typeof key !== "string") return;
  if (isEventProp(key)) return;

  target.removeAttribute(toAttributeName(key));
}

/**
 * Patch 목록을 순회하며 필요한 노드만 갱신한다.
 * @param {Element} rootEl
 * @param {Array<any>} patches
 * @returns {void}
 */
export function applyPatches(rootEl, patches) {
  if (!rootEl || !Array.isArray(patches)) return;

  for (const patch of patches) {
    if (!patch || typeof patch !== "object") continue;
    if (typeof patch.kind !== "string") continue;

    switch (patch.kind) {
      case "CREATE":
        applyCreatePatch(rootEl, patch);
        break;
      case "REMOVE":
        applyRemovePatch(rootEl, patch);
        break;
      case "REPLACE":
        applyReplacePatch(rootEl, patch);
        break;
      case "TEXT":
        applyTextPatch(rootEl, patch);
        break;
      case "SET_PROP":
        applySetPropPatch(rootEl, patch);
        break;
      case "REMOVE_PROP":
        applyRemovePropPatch(rootEl, patch);
        break;
      default:
        break;
    }
  }
}

export default applyPatches;
