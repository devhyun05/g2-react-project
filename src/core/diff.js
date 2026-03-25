import { NODE_KIND, VNODE_TEXT_PROP } from "./types.js";

const OWN = Object.prototype.hasOwnProperty;
const EVENT_PREFIX = "on";
const TEXT_PROP = VNODE_TEXT_PROP;

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
    const oldText = getNodeText(oldNode);
    const newText = getNodeText(newNode);
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
  const changed = [];

  for (let i = 0; i < oldKeys.length; i += 1) {
    const key = oldKeys[i];
    if (isEventHandlerProp(key)) continue;

    if (!OWN.call(newProps, key)) {
      changed.push({ kind: "REMOVE_PROP", path: path.slice(), key });
      continue;
    }

    const oldValue = oldProps[key];
    const newValue = newProps[key];
    if (oldValue !== newValue) {
      changed.push({ kind: "SET_PROP", path: path.slice(), key, value: newValue });
    }
  }

  for (let i = 0; i < newKeys.length; i += 1) {
    const key = newKeys[i];
    if (isEventHandlerProp(key)) continue;
    if (OWN.call(oldProps, key)) continue;
    changed.push({ kind: "SET_PROP", path: path.slice(), key, value: newProps[key] });
  }

  for (let i = 0; i < changed.length; i += 1) {
    patches.push(changed[i]);
  }
}

function getNodeKind(vnode) {
  const kind = vnode && vnode.nodeKind;
  if (kind === NODE_KIND.ELEMENT || kind === NODE_KIND.TEXT) return kind;
  if (vnode && vnode.type === NODE_KIND.TEXT) return NODE_KIND.TEXT;
  return NODE_KIND.ELEMENT;
}

function getNodeText(vnode) {
  const props = vnode && vnode.props;
  if (props != null && OWN.call(props, TEXT_PROP)) {
    const value = props[TEXT_PROP];
    if (value === null || value === undefined) return "";
    return String(value);
  }
  return vnode && OWN.call(vnode, "text") && vnode.text != null ? vnode.text : "";
}

function isEventHandlerProp(key) {
  return key.startsWith(EVENT_PREFIX);
}
