const MAX_VNODE_NODES = 400;
const MAX_VNODE_DEPTH = 24;
const MAX_PATCH_COUNT = 160;
const MAX_REPLACE_PATCHES = 24;
const UNSUPPORTED_INTERACTIVE_TAGS = new Set(["input", "textarea", "select", "option"]);

/**
 * @param {any} vnode
 * @returns {{ nodes: number, depth: number }}
 */
export function measureVNode(vnode) {
  if (!vnode || typeof vnode !== "object") {
    return { nodes: 0, depth: 0 };
  }

  const children = Array.isArray(vnode.children) ? vnode.children : [];
  let nodes = 1;
  let depth = 1;

  for (const child of children) {
    const childStats = measureVNode(child);
    nodes += childStats.nodes;
    depth = Math.max(depth, childStats.depth + 1);
  }

  return { nodes, depth };
}

/**
 * @param {any} vnode
 * @returns {string | null}
 */
export function findUnsupportedInteractiveTag(vnode) {
  if (!vnode || typeof vnode !== "object") {
    return null;
  }

  if (UNSUPPORTED_INTERACTIVE_TAGS.has(vnode.type)) {
    return vnode.type;
  }

  const children = Array.isArray(vnode.children) ? vnode.children : [];
  for (const child of children) {
    const tag = findUnsupportedInteractiveTag(child);
    if (tag) {
      return tag;
    }
  }

  return null;
}

/**
 * @param {any} vnode
 * @returns {{ ok: boolean, reason: string | null }}
 */
export function validateVNodeSafety(vnode) {
  if (!vnode || typeof vnode !== "object") {
    return { ok: false, reason: "Patch requires one valid root node." };
  }

  const unsupportedTag = findUnsupportedInteractiveTag(vnode);
  if (unsupportedTag) {
    return {
      ok: false,
      reason: `Unsupported interactive tag in test area: <${unsupportedTag}>.`,
    };
  }

  const stats = measureVNode(vnode);
  if (stats.nodes > MAX_VNODE_NODES) {
    return {
      ok: false,
      reason: `Tree is too large to patch safely (${stats.nodes} nodes).`,
    };
  }

  if (stats.depth > MAX_VNODE_DEPTH) {
    return {
      ok: false,
      reason: `Tree is too deep to patch safely (depth ${stats.depth}).`,
    };
  }

  return { ok: true, reason: null };
}

/**
 * @param {any} vnode
 * @returns {string}
 */
function nodeSignature(vnode) {
  if (!vnode || typeof vnode !== "object") {
    return "null";
  }

  if (vnode.type === "TEXT") {
    return `TEXT:${String(vnode.props?.nodeValue ?? "")}`;
  }

  const props = vnode.props || {};
  const identityKeys = ["id", "data-id", "className", "data-kind", "name", "value"];
  const identity = identityKeys
    .filter((key) => props[key] != null)
    .map((key) => `${key}=${String(props[key])}`)
    .join("|");
  const firstText = (Array.isArray(vnode.children) ? vnode.children : []).find(
    (child) => child?.type === "TEXT",
  )?.props?.nodeValue;

  return `${String(vnode.type)}|${identity}|${String(firstText ?? "")}`;
}

/**
 * @param {any[]} children
 * @returns {any[]}
 */
function getMeaningfulChildren(children) {
  return children.filter((child) => {
    if (!child || typeof child !== "object") {
      return false;
    }

    if (child.type !== "TEXT") {
      return true;
    }

    return String(child.props?.nodeValue ?? "").trim() !== "";
  });
}

/**
 * @param {any[]} left
 * @param {any[]} right
 * @returns {boolean}
 */
function hasSameChildSet(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = left.map(nodeSignature).sort();
  const rightSet = right.map(nodeSignature).sort();

  for (let index = 0; index < leftSet.length; index += 1) {
    if (leftSet[index] !== rightSet[index]) {
      return false;
    }
  }

  return true;
}

/**
 * @param {any} oldVNode
 * @param {any} newVNode
 * @returns {boolean}
 */
export function hasUnsupportedReorder(oldVNode, newVNode) {
  if (!oldVNode || !newVNode || oldVNode.type !== newVNode.type) {
    return false;
  }

  const oldChildren = getMeaningfulChildren(Array.isArray(oldVNode.children) ? oldVNode.children : []);
  const newChildren = getMeaningfulChildren(Array.isArray(newVNode.children) ? newVNode.children : []);

  if (
    oldChildren.length > 1 &&
    oldChildren.length === newChildren.length &&
    hasSameChildSet(oldChildren, newChildren)
  ) {
    const oldOrder = oldChildren.map(nodeSignature);
    const newOrder = newChildren.map(nodeSignature);
    const changedOrder = oldOrder.some((signature, index) => signature !== newOrder[index]);
    if (changedOrder) {
      return true;
    }
  }

  for (let index = 0; index < Math.min(oldChildren.length, newChildren.length); index += 1) {
    if (hasUnsupportedReorder(oldChildren[index], newChildren[index])) {
      return true;
    }
  }

  return false;
}

/**
 * @param {any[]} patches
 * @returns {{ useFullRender: boolean, reason: string | null }}
 */
export function getPatchSafetyFallback(oldVNode, newVNode, patches) {
  const replaceCount = patches.filter((patch) => patch?.kind === "REPLACE").length;
  const hasRootReplace = patches.some(
    (patch) => patch?.kind === "REPLACE" && Array.isArray(patch.path) && patch.path.length === 0,
  );

  if (hasRootReplace) {
    return {
      useFullRender: true,
      reason: "Detected a root replacement. Applied a full render for stability.",
    };
  }

  if (patches.length > MAX_PATCH_COUNT || replaceCount > MAX_REPLACE_PATCHES) {
    return {
      useFullRender: true,
      reason: "Detected a heavy patch set. Applied a full render for stability.",
    };
  }

  return { useFullRender: false, reason: null };
}
