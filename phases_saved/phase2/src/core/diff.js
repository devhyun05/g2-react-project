import { NODE_KIND } from "./types.js";

const OWN = Object.prototype.hasOwnProperty;
const EVENT_PREFIX = "on";
const TEXT_PROP = "nodeValue";

export function diff(oldVNode, newVNode) {
  const patches = [];
  walk(oldVNode, newVNode, [], patches);
  return patches;
}

function walk(oldNode, newNode, path, patches) {
  if (oldNode == null && newNode == null) return;
  if (oldNode === newNode) return;
  const currentPath = path;

  if (oldNode == null) {
    patches.push({ kind: "CREATE", path: currentPath.slice(), node: newNode });
    return;
  }

  if (newNode == null) {
    patches.push({ kind: "REMOVE", path: currentPath.slice() });
    return;
  }

  const oldKind = getNodeKind(oldNode);
  const newKind = getNodeKind(newNode);

  if (oldKind !== newKind || oldNode.type !== newNode.type) {
    patches.push({ kind: "REPLACE", path: currentPath.slice(), node: newNode });
    return;
  }

  if (oldKind === NODE_KIND.TEXT) {
    const oldText = getTextValue(oldNode);
    const newText = getTextValue(newNode);
    if (oldText !== newText) {
      patches.push({ kind: "TEXT", path: currentPath.slice(), text: newText });
    }
    return;
  }

  diffProps(oldNode, newNode, path, patches);

  const oldChildren = Array.isArray(oldNode.children) ? oldNode.children : [];
  const newChildren = Array.isArray(newNode.children) ? newNode.children : [];
  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLength; i += 1) {
    path.push(i);
    walk(oldChildren[i], newChildren[i], path, patches);
    path.pop();
  }
}

function getTextValue(vnode) {
  const props = vnode && vnode.props;
  if (props != null && OWN.call(props, TEXT_PROP)) {
    const value = props[TEXT_PROP];
    if (value === null || value === undefined) return "";
    return String(value);
  }
  return "";
}

function diffProps(oldNode, newNode, path, patches) {
  const oldProps = oldNode.props || {};
  const newProps = newNode.props || {};

  const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
  for (const key of keys) {
    if (isEventHandlerProp(key)) continue;

    const oldHas = Object.prototype.hasOwnProperty.call(oldProps, key);
    const newHas = Object.prototype.hasOwnProperty.call(newProps, key);

    const oldValue = oldHas ? oldProps[key] : undefined;
    const newValue = newHas ? newProps[key] : undefined;

    if (!oldHas && newHas) {
      patches.push({
        kind: "SET_PROP",
        path: [...path],
        key,
        value: String(newValue ?? ""),
      });
      continue;
    }

    if (oldHas && !newHas) {
      patches.push({ kind: "REMOVE_PROP", path: path.slice(), key });
      continue;
    }

    if (oldValue !== newValue) {
      patches.push({
        kind: "SET_PROP",
        path: path.slice(),
        key,
        value: String(newValue ?? ""),
      });
    }
  }
}

function isEventHandlerProp(key) {
  return key.startsWith(EVENT_PREFIX);
}

function getNodeKind(vnode) {
  const kind = vnode && vnode.nodeKind;
  if (kind === NODE_KIND.TEXT || kind === NODE_KIND.ELEMENT) return kind;
  if (vnode && vnode.type === NODE_KIND.TEXT) return NODE_KIND.TEXT;
  return NODE_KIND.ELEMENT;
}

