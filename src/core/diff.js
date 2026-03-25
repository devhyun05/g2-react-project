import { NODE_KIND } from "./types.js";

const OWN = Object.prototype.hasOwnProperty;
const EVENT_PREFIX = "on";

export function diff(oldVNode, newVNode) {
  const patches = [];
  const path = [];
  walk(oldVNode, newVNode, path, patches);
  return patches;
}

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

  const oldChildren = oldNode.children || [];
  const newChildren = newNode.children || [];
  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLength; i += 1) {
    path.push(i);
    walk(oldChildren[i], newChildren[i], path, patches);
    path.pop();
  }
}

function diffProps(oldNode, newNode, path, patches) {
  const oldProps = oldNode.props || {};
  const newProps = newNode.props || {};

  const oldKeys = Object.keys(oldProps);
  const newKeys = Object.keys(newProps);

  for (let i = 0; i < oldKeys.length; i += 1) {
    const key = oldKeys[i];
    if (isEventHandlerProp(key)) continue;
    if (!OWN.call(newProps, key)) {
      patches.push({ kind: "REMOVE_PROP", path: path.slice(), key });
      continue;
    }
    const oldValue = oldProps[key];
    const newValue = newProps[key];
    if (oldValue !== newValue) {
      patches.push({ kind: "SET_PROP", path: path.slice(), key, value: newValue });
    }
  }

  for (let i = 0; i < newKeys.length; i += 1) {
    const key = newKeys[i];
    if (isEventHandlerProp(key)) continue;
    if (!OWN.call(oldProps, key)) {
      patches.push({ kind: "SET_PROP", path: path.slice(), key, value: newProps[key] });
    }
  }
}

function getNodeKind(vnode) {
  const kind = vnode && vnode.nodeKind;
  if (kind === NODE_KIND.TEXT || kind === NODE_KIND.ELEMENT) return kind;
  if (vnode && vnode.type === NODE_KIND.TEXT) return NODE_KIND.TEXT;
  return NODE_KIND.ELEMENT;
}

function getTextValue(vnode) {
  const props = vnode && vnode.props;
  if (props != null && OWN.call(props, "nodeValue")) {
    const value = props.nodeValue;
    if (value === null || value === undefined) return "";
    return String(value);
  }
  return "";
}

function isEventHandlerProp(key) {
  return key.startsWith(EVENT_PREFIX);
}
