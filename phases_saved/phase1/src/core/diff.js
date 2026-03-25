const TEXT_KIND = "TEXT";
const TEXT_PROP = "nodeValue";
const EVENT_PREFIX = "on";
const OWN = Object.prototype.hasOwnProperty;

export function diff(oldVNode, newVNode) {
  const patches = [];
  walk(oldVNode, newVNode, [], patches);
  return patches;
}

function walk(oldNode, newNode, path, patches) {
  if (oldNode == null && newNode == null) return;
  if (oldNode === newNode) return;

  if (oldNode == null) {
    patches.push({ kind: "CREATE", path: path.slice(0), node: newNode });
    return;
  }

  if (newNode == null) {
    patches.push({ kind: "REMOVE", path: path.slice(0) });
    return;
  }

  const oldKind = getNodeKind(oldNode);
  const newKind = getNodeKind(newNode);

  if (oldKind !== newKind || oldNode.type !== newNode.type) {
    patches.push({ kind: "REPLACE", path: path.slice(0), node: newNode });
    return;
  }

  if (oldKind === TEXT_KIND) {
    const oldText = getTextValue(oldNode);
    const newText = getTextValue(newNode);
    if (oldText !== newText) {
      patches.push({ kind: "TEXT", path: path.slice(0), text: newText });
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

function getNodeKind(vnode) {
  return vnode && vnode.type === TEXT_KIND ? TEXT_KIND : "ELEMENT";
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

  const oldKeys = Object.keys(oldProps);
  const newKeys = Object.keys(newProps);

  for (let i = 0; i < oldKeys.length; i += 1) {
    const key = oldKeys[i];
    if (isEventHandlerProp(key)) continue;
    if (!OWN.call(newProps, key)) {
      patches.push({ kind: "REMOVE_PROP", path: path.slice(0), key });
      continue;
    }

    const oldValue = oldProps[key];
    const newValue = newProps[key];
    if (oldValue !== newValue) {
      patches.push({ kind: "SET_PROP", path: path.slice(0), key, value: String(newValue ?? "") });
    }
  }

  for (let i = 0; i < newKeys.length; i += 1) {
    const key = newKeys[i];
    if (isEventHandlerProp(key)) continue;
    if (OWN.call(oldProps, key)) continue;
    patches.push({ kind: "SET_PROP", path: path.slice(0), key, value: String(newProps[key] ?? "") });
  }
}

function isEventHandlerProp(key) {
  return key.startsWith(EVENT_PREFIX);
}
