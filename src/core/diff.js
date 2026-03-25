import { NODE_KIND, TEXT_NODE_TYPE } from "./types.js";

const OWN = Object.prototype.hasOwnProperty;
const EVENT_PREFIX = "on";

/**
 * @param {{ type: string, props: Record<string, string>, children: Array } | null} oldVNode
 * @param {{ type: string, props: Record<string, string>, children: Array } | null} newVNode
 * @returns {Array}
 */
export function diff(oldVNode, newVNode) {
  const patches = [];
  const path = [];

  walk(oldVNode, newVNode, path, patches);

  return patches;
}

/**
 * @param {any} oldNode
 * @param {any} newNode
 * @param {number[]} path
 * @param {Array} patches
 * @returns {void}
 */
function walk(oldNode, newNode, path, patches) {
  if (oldNode === newNode) return;
  if (oldNode == null && newNode == null) return;

  if (oldNode == null) {
    patches.push({ kind: "CREATE", path: path.slice(), node: newNode });
    return;
  }

  if (newNode == null) {
    patches.push({ kind: "REMOVE", path: path.slice() });
    return;
  }

  const oldKind = getNodeKind(oldNode);
  const newKind = getNodeKind(newNode);

  if (oldKind !== newKind || oldNode.type !== newNode.type) {
    patches.push({ kind: "REPLACE", path: path.slice(), node: newNode });
    return;
  }

  if (oldKind === NODE_KIND.TEXT) {
    const oldText = getTextValue(oldNode);
    const newText = getTextValue(newNode);

    if (oldText !== newText) {
      patches.push({ kind: "TEXT", path: path.slice(), text: newText });
    }

    return;
  }

  diffProps(oldNode, newNode, path, patches);

  const oldChildren = Array.isArray(oldNode.children) ? oldNode.children : [];
  const newChildren = Array.isArray(newNode.children) ? newNode.children : [];
  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let index = 0; index < maxLength; index += 1) {
    path.push(index);
    walk(oldChildren[index], newChildren[index], path, patches);
    path.pop();
  }
}

/**
 * @param {any} oldNode
 * @param {any} newNode
 * @param {number[]} path
 * @param {Array} patches
 * @returns {void}
 */
function diffProps(oldNode, newNode, path, patches) {
  const oldProps = oldNode.props || {};
  const newProps = newNode.props || {};

  for (const key of Object.keys(oldProps)) {
    if (key === "nodeValue" || isEventHandlerProp(key)) {
      continue;
    }

    if (!OWN.call(newProps, key)) {
      patches.push({ kind: "REMOVE_PROP", path: path.slice(), key });
      continue;
    }

    if (oldProps[key] !== newProps[key]) {
      patches.push({
        kind: "SET_PROP",
        path: path.slice(),
        key,
        value: String(newProps[key] ?? ""),
      });
    }
  }

  for (const key of Object.keys(newProps)) {
    if (key === "nodeValue" || isEventHandlerProp(key)) {
      continue;
    }

    if (!OWN.call(oldProps, key)) {
      patches.push({
        kind: "SET_PROP",
        path: path.slice(),
        key,
        value: String(newProps[key] ?? ""),
      });
    }
  }
}

/**
 * @param {any} vnode
 * @returns {string}
 */
function getNodeKind(vnode) {
  return vnode?.type === TEXT_NODE_TYPE ? NODE_KIND.TEXT : NODE_KIND.ELEMENT;
}

/**
 * @param {any} vnode
 * @returns {string}
 */
function getTextValue(vnode) {
  const props = vnode?.props;

  if (props != null && OWN.call(props, "nodeValue")) {
    return String(props.nodeValue ?? "");
  }

  return "";
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isEventHandlerProp(key) {
  return key.startsWith(EVENT_PREFIX);
}
