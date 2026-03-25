import { NODE_KIND } from "./types.js";

const OWN = Object.prototype.hasOwnProperty;
const EVENT_PREFIX = "on";
const TEXT_PROP = "nodeValue";

/**
 * Myers-style keyed child diff (LIS-optimized, move-only patch model):
 * keys that are stable and uniquely identifiable are reused; order change is
 * translated into remove/create pairs since only CREATE/REMOVE are available.
 */
export function diff(oldVNode, newVNode) {
  const patches = [];
  walk(oldVNode, newVNode, [], patches);
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

  if (isSubtreeEqual(oldNode, newNode)) {
    return;
  }

  diffProps(oldNode, newNode, path, patches);
  diffChildren(oldNode.children || [], newNode.children || [], path, patches);
}

function diffChildren(oldChildren, newChildren, path, patches) {
  if (oldChildren.length === 0 && newChildren.length === 0) return;

  if (allKeyed(oldChildren) && allKeyed(newChildren) && hasUniqueKeys(oldChildren) && hasUniqueKeys(newChildren)) {
    diffChildrenByKeys(oldChildren, newChildren, path, patches);
    return;
  }

  const maxLength = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < maxLength; i += 1) {
    path.push(i);
    walk(oldChildren[i], newChildren[i], path, patches);
    path.pop();
  }
}

function diffChildrenByKeys(oldChildren, newChildren, path, patches) {
  const oldIndexByKey = new Map();
  for (let i = 0; i < oldChildren.length; i += 1) {
    oldIndexByKey.set(oldChildren[i].key, i);
  }

  const oldIndexByNewIndex = [];
  for (let i = 0; i < newChildren.length; i += 1) {
    const child = newChildren[i];
    oldIndexByNewIndex.push(oldIndexByKey.has(child.key) ? oldIndexByKey.get(child.key) : -1);
  }

  const lis = longestIncreasingSubsequence(oldIndexByNewIndex.filter((i) => i >= 0));
  const lisSet = new Set(lis);

  const removedIndexes = [];
  const newKeySet = new Set(newChildren.map((child) => child.key));

  for (let i = 0; i < oldChildren.length; i += 1) {
    const key = oldChildren[i].key;
    if (!newKeySet.has(key)) {
      removedIndexes.push(i);
      continue;
    }

    if (!lisSet.has(i)) {
      removedIndexes.push(i);
    }
  }

  removedIndexes.sort((a, b) => b - a);
  for (const oldIndex of removedIndexes) {
    path.push(oldIndex);
    walk(oldChildren[oldIndex], null, path, patches);
    path.pop();
  }

  for (let newIndex = 0; newIndex < newChildren.length; newIndex += 1) {
    const oldIndex = oldIndexByNewIndex[newIndex];
    const newChild = newChildren[newIndex];

    if (oldIndex >= 0 && lisSet.has(oldIndex)) {
      path.push(newIndex);
      walk(oldChildren[oldIndex], newChild, path, patches);
      path.pop();
      continue;
    }

    path.push(newIndex);
    walk(null, newChild, path, patches);
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
      patches.push({ kind: "SET_PROP", path: path.slice(), key, value: String(newValue ?? "") });
    }
  }

  for (let i = 0; i < newKeys.length; i += 1) {
    const key = newKeys[i];
    if (isEventHandlerProp(key)) continue;
    if (OWN.call(oldProps, key)) continue;
    patches.push({ kind: "SET_PROP", path: path.slice(), key, value: String(newProps[key] ?? "") });
  }
}

function isSubtreeEqual(left, right) {
  if (left === right) return true;
  if (left.nodeKind !== right.nodeKind || left.type !== right.type) return false;

  const leftText = left.children == null ? 0 : left.children.length;
  const rightText = right.children == null ? 0 : right.children.length;
  if (leftText !== rightText) return false;
  if (leftText > 0 || rightText > 0) return false;

  const leftProps = left.props || {};
  const rightProps = right.props || {};
  const leftKeys = Object.keys(leftProps);
  const rightKeys = Object.keys(rightProps);

  if (leftKeys.length !== rightKeys.length) return false;
  for (let i = 0; i < leftKeys.length; i += 1) {
    const key = leftKeys[i];
    if (isEventHandlerProp(key)) continue;
    if (!OWN.call(rightProps, key) || leftProps[key] !== rightProps[key]) return false;
  }

  return true;
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
  return "";
}

function isEventHandlerProp(key) {
  return key.startsWith(EVENT_PREFIX);
}

function allKeyed(children) {
  return children.every((child) => child && child.key != null);
}

function hasUniqueKeys(children) {
  const seen = new Set();
  for (let i = 0; i < children.length; i += 1) {
    const key = children[i].key;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

function longestIncreasingSubsequence(values) {
  const tails = [];
  const tailsIndexes = [];
  const predecessors = new Array(values.length).fill(-1);

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    let lo = 0;
    let hi = tails.length;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (tails[mid] >= value) hi = mid;
      else lo = mid + 1;
    }

    if (lo === tails.length) {
      tails.push(value);
      tailsIndexes.push(i);
    } else {
      tails[lo] = value;
      tailsIndexes[lo] = i;
    }

    if (lo > 0) {
      predecessors[i] = tailsIndexes[lo - 1];
    }
  }

  const sequence = [];
  let cursor = tailsIndexes[tails.length - 1];
  while (cursor !== -1 && cursor < values.length) {
    sequence.push(values[cursor]);
    cursor = predecessors[cursor];
  }
  return sequence.reverse();
}

