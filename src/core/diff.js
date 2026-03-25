const TEXT_KIND = "TEXT";
const TEXT_PROP = "nodeValue";
const EVENT_PREFIX = "on";
const OWN = Object.prototype.hasOwnProperty;

const ENABLE_KEYED_CHILD_DIFF = true;
const ENABLE_STABLE_KEY_INFERENCE = false;
const PATH_SEPARATOR = "/";

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

  const oldType = oldNode.type;
  const newType = newNode.type;

  if (oldType !== newType) {
    patches.push({ kind: "REPLACE", path: path.slice(0), node: newNode });
    return;
  }

  const isText = oldType === TEXT_KIND;

  if (!isText && isSubtreeEqual(oldNode, newNode)) {
    return;
  }

  if (isText) {
    const oldText = getTextValue(oldNode);
    const newText = getTextValue(newNode);
    if (oldText !== newText) {
      patches.push({ kind: "TEXT", path: path.slice(0), text: newText });
    }
    return;
  }

  diffProps(oldNode, newNode, path, patches);

  const oldChildren = oldNode.children || [];
  const newChildren = newNode.children || [];

  const normalizedOldChildren = ENABLE_STABLE_KEY_INFERENCE
    ? assignStableKeysForChildren(oldChildren, path)
    : oldChildren;
  const normalizedNewChildren = ENABLE_STABLE_KEY_INFERENCE
    ? assignStableKeysForChildren(newChildren, path)
    : newChildren;

  diffChildren(normalizedOldChildren, normalizedNewChildren, path, patches);
}

function diffChildren(oldChildren, newChildren, path, patches) {
  if (!oldChildren.length && !newChildren.length) return;

  const canUseKeyedDiff =
    ENABLE_KEYED_CHILD_DIFF &&
    isReusableKeyedChildren(oldChildren) &&
    isReusableKeyedChildren(newChildren);

  if (canUseKeyedDiff) {
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
    const key = getVNodeKey(oldChildren[i]);
    if (key != null) {
      oldIndexByKey.set(key, i);
    }
  }

  const newIndexToOldIndex = new Array(newChildren.length);
  const oldIndexesInNewOrder = [];
  const oldKeysInNew = new Set();

  for (let newIndex = 0; newIndex < newChildren.length; newIndex += 1) {
    const child = newChildren[newIndex];
    const key = getVNodeKey(child);
    oldKeysInNew.add(key);

    const oldIndex = oldIndexByKey.has(key) ? oldIndexByKey.get(key) : -1;
    newIndexToOldIndex[newIndex] = oldIndex;
    if (oldIndex >= 0) oldIndexesInNewOrder.push(oldIndex);
  }

  const lis = longestIncreasingSubsequence(oldIndexesInNewOrder);
  const lisSet = new Set(lis);

  for (let oldIndex = oldChildren.length - 1; oldIndex >= 0; oldIndex -= 1) {
    const oldKey = getVNodeKey(oldChildren[oldIndex]);
    if (!oldKeysInNew.has(oldKey) || !lisSet.has(oldIndex)) {
      path.push(oldIndex);
      walk(oldChildren[oldIndex], null, path, patches);
      path.pop();
    }
  }

  for (let newIndex = 0; newIndex < newChildren.length; newIndex += 1) {
    const oldIndex = newIndexToOldIndex[newIndex];
    const newChild = newChildren[newIndex];

    path.push(newIndex);
    if (oldIndex >= 0 && lisSet.has(oldIndex)) {
      walk(oldChildren[oldIndex], newChild, path, patches);
    } else {
      walk(null, newChild, path, patches);
    }
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

function isSubtreeEqual(left, right) {
  if (left === right) return true;
  if ((left.children?.length ?? 0) !== (right.children?.length ?? 0)) return false;
  if ((left.children?.length ?? 0) > 0) return false;

  const leftProps = left.props || {};
  const rightProps = right.props || {};

  let leftCount = 0;

  for (const key in leftProps) {
    if (!OWN.call(leftProps, key) || isEventHandlerProp(key)) continue;
    leftCount += 1;
    if (!OWN.call(rightProps, key)) return false;
    if (leftProps[key] !== rightProps[key]) return false;
  }

  for (const key in rightProps) {
    if (!OWN.call(rightProps, key) || isEventHandlerProp(key)) continue;
    if (!OWN.call(leftProps, key)) return false;
    leftCount -= 1;
  }

  return leftCount === 0;
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

function isEventHandlerProp(key) {
  return key.startsWith(EVENT_PREFIX);
}

function getVNodeKey(vnode) {
  if (!vnode || typeof vnode !== "object") {
    return null;
  }

  if (vnode.key != null) {
    return String(vnode.key);
  }

  const props = vnode.props && typeof vnode.props === "object" ? vnode.props : null;
  if (props?.key != null) {
    return String(props.key);
  }

  return null;
}

function isReusableKeyedChildren(children) {
  if (children.length === 0) return true;

  const keys = new Set();
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    const key = getVNodeKey(child);
    if (key == null) return false;
    if (keys.has(key)) return false;
    keys.add(key);
  }

  return true;
}

function assignStableKeysForChildren(children, parentPath) {
  const usedKeys = new Set();
  const result = new Array(children.length);

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!child) {
      result[index] = child;
      continue;
    }

    const candidateKey = buildStableChildKey(child, parentPath, index);
    const normalized = normalizeKeyValue(candidateKey);
    const uniqueKey = ensureUniqueKey(normalized, usedKeys);

    const childWithKey = { ...child, key: uniqueKey };
    usedKeys.add(uniqueKey);
    result[index] = childWithKey;
  }

  return result;
}

function buildStableChildKey(child, parentPath, index) {
  const props = child.props || {};

  if (child.key != null) return child.key;
  if (props.key != null) return props.key;
  if (props.id != null) return props.id;
  if (props.uuid != null) return props.uuid;
  if (props._id != null) return props._id;
  if (props.name != null) return `${child.type}|${props.name}`;
  if (props.value != null) return `${child.type}|${props.value}`;

  return `${child.type ?? "NODE"}|${parentPath.join(PATH_SEPARATOR)}|fallback-${index}`;
}

function normalizeKeyValue(rawKey) {
  if (rawKey == null) return "";
  return String(rawKey);
}

function ensureUniqueKey(baseKey, usedKeys) {
  if (!usedKeys.has(baseKey)) return baseKey;

  let suffix = 1;
  while (usedKeys.has(`${baseKey}#${suffix}`)) {
    suffix += 1;
  }
  return `${baseKey}#${suffix}`;
}

function longestIncreasingSubsequence(values) {
  const tails = [];
  const tailsIndex = [];
  const prevIndex = new Array(values.length).fill(-1);

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    let left = 0;
    let right = tails.length;

    while (left < right) {
      const mid = (left + right) >>> 1;
      if (tails[mid] >= value) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    if (left === tails.length) {
      tails.push(value);
      tailsIndex.push(i);
    } else {
      tails[left] = value;
      tailsIndex[left] = i;
    }

    if (left > 0) {
      prevIndex[i] = tailsIndex[left - 1];
    }
  }

  const seq = [];
  let cursor = tailsIndex[tailsIndex.length - 1];
  while (cursor !== -1) {
    seq.push(values[cursor]);
    cursor = prevIndex[cursor];
  }

  return seq.reverse();
}
