const GENERATED_KEY = Symbol("generated-key");
const GENERATED_KEY_PREFIX = "auto";
const IDENTITY_PROP_NAMES = [
  "data-key",
  "data-id",
  "id",
  "uuid",
  "_id",
  "name",
  "value",
  "data-index",
];
const IDENTITY_PROP_NAME_SET = new Set(IDENTITY_PROP_NAMES);

export function createIdentityState(nextGeneratedId = 0) {
  const normalized = Number.isInteger(nextGeneratedId) && nextGeneratedId >= 0 ? nextGeneratedId : 0;
  return { nextGeneratedId: normalized };
}

export function cloneWithVNodeMetadata(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (Array.isArray(value)) {
    const clone = [];
    seen.set(value, clone);

    for (const item of value) {
      clone.push(cloneWithVNodeMetadata(item, seen));
    }

    return clone;
  }

  const clone = {};
  seen.set(value, clone);

  for (const key of Object.keys(value)) {
    clone[key] = cloneWithVNodeMetadata(value[key], seen);
  }

  const generatedKey = getGeneratedVNodeKey(value);
  if (generatedKey != null) {
    setGeneratedVNodeKey(clone, generatedKey);
  }

  return clone;
}

export function getStableVNodeKey(vnode) {
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

  for (const propName of IDENTITY_PROP_NAMES) {
    if (props?.[propName] != null) {
      return `${String(vnode.type ?? "NODE")}|${propName}|${String(props[propName])}`;
    }
  }

  return null;
}

export function getGeneratedVNodeKey(vnode) {
  if (!vnode || typeof vnode !== "object") {
    return null;
  }

  return vnode[GENERATED_KEY] != null ? String(vnode[GENERATED_KEY]) : null;
}

export function getVNodeKey(vnode) {
  return getStableVNodeKey(vnode) ?? getGeneratedVNodeKey(vnode);
}

export function seedVNodeIdentity(vnode, state) {
  const normalizedState = normalizeIdentityState(state);
  seedChildList(getChildren(vnode), normalizedState);
  return normalizedState;
}

export function reconcileVNodeIdentity(previousVNode, nextVNode, state) {
  const normalizedState = normalizeIdentityState(state);

  if (!nextVNode || typeof nextVNode !== "object") {
    return normalizedState;
  }

  if (!previousVNode || previousVNode.type !== nextVNode.type) {
    seedChildList(getChildren(nextVNode), normalizedState);
    return normalizedState;
  }

  reconcileChildList(getChildren(previousVNode), getChildren(nextVNode), normalizedState);
  return normalizedState;
}

function reconcileChildList(oldChildren, newChildren, state) {
  if (!oldChildren.length && !newChildren.length) {
    return;
  }

  const oldStableByKey = new Map();
  const oldGeneratedBySignature = new Map();
  const remainingSignatureCounts = new Map();
  const usedOldChildren = new Set();

  for (const oldChild of oldChildren) {
    const stableKey = getStableVNodeKey(oldChild);
    if (stableKey != null) {
      pushQueueValue(oldStableByKey, stableKey, oldChild);
      continue;
    }

    const generatedKey = ensureGeneratedKey(oldChild, state);
    const signature = buildGeneratedKeySignature(oldChild);
    if (generatedKey != null) {
      pushQueueValue(oldGeneratedBySignature, signature, oldChild);
    }
  }

  for (const newChild of newChildren) {
    if (getStableVNodeKey(newChild) != null) {
      continue;
    }

    const signature = buildGeneratedKeySignature(newChild);
    remainingSignatureCounts.set(signature, (remainingSignatureCounts.get(signature) ?? 0) + 1);
  }

  const matchedPairs = [];

  for (let index = 0; index < newChildren.length; index += 1) {
    const newChild = newChildren[index];
    const stableKey = getStableVNodeKey(newChild);

    if (stableKey != null) {
      const matchedOldChild = shiftQueueValue(oldStableByKey, stableKey, usedOldChildren);
      if (matchedOldChild) {
        usedOldChildren.add(matchedOldChild);
      }
      matchedPairs.push([matchedOldChild ?? null, newChild]);
      continue;
    }

    const signature = buildGeneratedKeySignature(newChild);
    decrementSignatureCount(remainingSignatureCounts, signature);
    const matchedOldChild = shiftQueueValue(oldGeneratedBySignature, signature, usedOldChildren);

    if (matchedOldChild) {
      usedOldChildren.add(matchedOldChild);
      const inheritedKey = getGeneratedVNodeKey(matchedOldChild);
      if (inheritedKey != null) {
        setGeneratedVNodeKey(newChild, inheritedKey);
      }
      matchedPairs.push([matchedOldChild, newChild]);
      continue;
    }

    const fallbackOldChild = findSameIndexFallbackMatch(
      oldChildren,
      index,
      newChild,
      usedOldChildren,
      remainingSignatureCounts,
    );

    if (fallbackOldChild) {
      usedOldChildren.add(fallbackOldChild);
      const inheritedKey = getGeneratedVNodeKey(fallbackOldChild);
      if (inheritedKey != null) {
        setGeneratedVNodeKey(newChild, inheritedKey);
      }
      matchedPairs.push([fallbackOldChild, newChild]);
      continue;
    }

    ensureGeneratedKey(newChild, state);
    matchedPairs.push([null, newChild]);
  }

  for (const [matchedOldChild, newChild] of matchedPairs) {
    if (matchedOldChild && matchedOldChild.type === newChild.type) {
      reconcileChildList(getChildren(matchedOldChild), getChildren(newChild), state);
    } else {
      seedChildList(getChildren(newChild), state);
    }
  }
}

function seedChildList(children, state) {
  for (const child of children) {
    ensureGeneratedKey(child, state);
    seedChildList(getChildren(child), state);
  }
}

function ensureGeneratedKey(vnode, state) {
  if (!vnode || typeof vnode !== "object") {
    return null;
  }

  if (getStableVNodeKey(vnode) != null) {
    return null;
  }

  const current = getGeneratedVNodeKey(vnode);
  if (current != null) {
    return current;
  }

  const nextKey = `${GENERATED_KEY_PREFIX}-${state.nextGeneratedId}`;
  state.nextGeneratedId += 1;
  setGeneratedVNodeKey(vnode, nextKey);
  return nextKey;
}

function setGeneratedVNodeKey(vnode, key) {
  if (!vnode || typeof vnode !== "object" || key == null) {
    return;
  }

  Object.defineProperty(vnode, GENERATED_KEY, {
    value: String(key),
    enumerable: false,
    configurable: true,
    writable: true,
  });
}

function buildGeneratedKeySignature(vnode) {
  if (!vnode || typeof vnode !== "object") {
    return "null";
  }

  if (vnode.type === "TEXT") {
    return `TEXT|${String(vnode.props?.nodeValue ?? "")}`;
  }

  const props = vnode.props && typeof vnode.props === "object" ? vnode.props : {};
  const propSignature = Object.keys(props)
    .filter((key) => !IDENTITY_PROP_NAME_SET.has(key) && !key.startsWith("on"))
    .sort()
    .map((key) => `${key}=${String(props[key] ?? "")}`)
    .join("&");
  const childTypes = getChildren(vnode)
    .map((child) => String(child?.type ?? "UNKNOWN"))
    .join(",");
  const firstText = findFirstTextValue(vnode);

  return `${String(vnode.type ?? "NODE")}|${propSignature}|${childTypes}|${firstText}`;
}

function findFirstTextValue(vnode) {
  for (const child of getChildren(vnode)) {
    if (!child || typeof child !== "object") {
      continue;
    }

    if (child.type === "TEXT") {
      return String(child.props?.nodeValue ?? "");
    }

    const nested = findFirstTextValue(child);
    if (nested !== "") {
      return nested;
    }
  }

  return "";
}

function getChildren(vnode) {
  return vnode && Array.isArray(vnode.children) ? vnode.children : [];
}

function normalizeIdentityState(state) {
  if (!state || typeof state !== "object") {
    return createIdentityState();
  }

  if (!Number.isInteger(state.nextGeneratedId) || state.nextGeneratedId < 0) {
    state.nextGeneratedId = 0;
  }

  return state;
}

function pushQueueValue(map, key, value) {
  if (!map.has(key)) {
    map.set(key, []);
  }

  map.get(key).push(value);
}

function shiftQueueValue(map, key, usedOldChildren = null) {
  const queue = map.get(key);
  if (!queue || queue.length === 0) {
    return null;
  }

  while (queue.length > 0) {
    const value = queue.shift() ?? null;
    if (!value || !usedOldChildren || !usedOldChildren.has(value)) {
      return value;
    }
  }

  return null;
}

function decrementSignatureCount(signatureCounts, signature) {
  const currentCount = signatureCounts.get(signature) ?? 0;
  if (currentCount <= 1) {
    signatureCounts.delete(signature);
    return;
  }

  signatureCounts.set(signature, currentCount - 1);
}

function findSameIndexFallbackMatch(
  oldChildren,
  index,
  newChild,
  usedOldChildren,
  remainingSignatureCounts,
) {
  const oldChild = oldChildren[index];
  if (!oldChild || usedOldChildren.has(oldChild)) {
    return null;
  }

  if (getStableVNodeKey(oldChild) != null || oldChild.type !== newChild?.type) {
    return null;
  }

  const oldSignature = buildGeneratedKeySignature(oldChild);
  if ((remainingSignatureCounts.get(oldSignature) ?? 0) > 0) {
    return null;
  }

  return oldChild;
}
