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
 * @param {unknown} patch
 * @returns {string|null}
 */
function getPatchType(patch) {
  if (!patch || typeof patch !== "object") return null;
  if (typeof patch.type === "string") return patch.type;
  if (typeof patch.kind === "string") return patch.kind;
  return null;
}

/**
 * @param {unknown} patch
 * @returns {any}
 */
function getPatchNode(patch) {
  if (!patch || typeof patch !== "object") return null;
  return patch.node ?? patch.vnode ?? patch.payload?.node ?? null;
}

/**
 * @param {unknown} patch
 * @returns {string}
 */
function getPatchText(patch) {
  if (!patch || typeof patch !== "object") return "";

  if (typeof patch.text === "string") return patch.text;
  if (typeof patch.payload?.text === "string") return patch.payload.text;

  const node = getPatchNode(patch);
  if (node && node.type === "TEXT" && node.props && typeof node.props.nodeValue !== "undefined") {
    return String(node.props.nodeValue);
  }

  return "";
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
 * rootEl은 wrapper, path는 wrapper 내부의 root(firstChild)를 기준으로 탐색한다.
 * path=[] 인 경우 wrapper의 firstChild를 반환한다.
 * @param {Element} rootEl
 * @param {number[]} path
 * @returns {Node|null}
 */
export function getDOMNodeByPath(rootEl, path) {
  if (!rootEl || !Array.isArray(path)) return null;

  let current = rootEl.firstChild;
  if (!current) return null;
  if (path.length === 0) return current;

  for (const index of path) {
    if (!Number.isInteger(index) || index < 0) return null;
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
  if (!rootEl || !Array.isArray(path)) return null;
  if (path.length === 0) return rootEl;
  return getDOMNodeByPath(rootEl, path.slice(0, -1));
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applyCreatePatch(rootEl, patch) {
  const path = Array.isArray(patch.path) ? patch.path : [];
  const vnode = getPatchNode(patch);
  if (!vnode) return;

  const newNode = createDOMNodeFromVNode(vnode);

  if (path.length === 0) {
    const first = rootEl.firstChild;
    if (first) {
      rootEl.insertBefore(newNode, first);
    } else {
      rootEl.appendChild(newNode);
    }
    return;
  }

  const parent = getParentNodeByPath(rootEl, path);
  if (!parent || !parent.childNodes) return;

  const index = path[path.length - 1];
  const referenceNode = parent.childNodes[index] ?? null;
  if (referenceNode) {
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
  const target = getDOMNodeByPath(rootEl, Array.isArray(patch.path) ? patch.path : []);
  if (target && target.parentNode) {
    target.parentNode.removeChild(target);
  }
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applyReplacePatch(rootEl, patch) {
  const path = Array.isArray(patch.path) ? patch.path : [];
  const vnode = getPatchNode(patch);
  if (!vnode) return;

  const newNode = createDOMNodeFromVNode(vnode);
  const target = getDOMNodeByPath(rootEl, path);

  if (target && typeof target.replaceWith === "function") {
    target.replaceWith(newNode);
    return;
  }

  if (path.length === 0) {
    const first = rootEl.firstChild;
    if (first) {
      rootEl.replaceChild(newNode, first);
    } else {
      rootEl.appendChild(newNode);
    }
  }
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applyTextPatch(rootEl, patch) {
  const target = getDOMNodeByPath(rootEl, Array.isArray(patch.path) ? patch.path : []);
  if (!target) return;

  const nextText = getPatchText(patch);
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
  const target = getDOMNodeByPath(rootEl, Array.isArray(patch.path) ? patch.path : []);
  if (!target || target.nodeType !== 1) return;

  const key = patch.key ?? patch.payload?.key;
  const value = patch.value ?? patch.payload?.value;
  if (typeof key !== "string" || typeof value === "undefined" || value === null) return;
  if (isEventProp(key)) return;

  target.setAttribute(toAttributeName(key), String(value));
}

/**
 * @param {Element} rootEl
 * @param {any} patch
 */
function applyRemovePropPatch(rootEl, patch) {
  const target = getDOMNodeByPath(rootEl, Array.isArray(patch.path) ? patch.path : []);
  if (!target || target.nodeType !== 1) return;

  const key = patch.key ?? patch.payload?.key;
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
    const patchType = getPatchType(patch);

    switch (patchType) {
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
