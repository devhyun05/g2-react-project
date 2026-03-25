import { NODE_KIND } from "./types.js";

/**
 * Reference implementation target: Agent B Diff
 * - Myers-like sequence strategy for children is approximated with longest
 *   common subsequence over keyed items using LIS.
 * - My focus is deterministic minimal patch generation without MOVE support.
 *
 * @typedef {Object} VNode
 * @property {"ELEMENT"|"TEXT"} nodeKind
 * @property {string} type
 * @property {Record<string, string>} props
 * @property {VNode[]} children
 * @property {string | null} text
 * @property {string | null} key
 */

/**
 * @typedef {Object} PatchCreate
 * @property {"CREATE"} kind
 * @property {number[]} path
 * @property {VNode} node
 */

/**
 * @typedef {Object} PatchRemove
 * @property {"REMOVE"} kind
 * @property {number[]} path
 */

/**
 * @typedef {Object} PatchReplace
 * @property {"REPLACE"} kind
 * @property {number[]} path
 * @property {VNode} node
 */

/**
 * @typedef {Object} PatchText
 * @property {"TEXT"} kind
 * @property {number[]} path
 * @property {string} text
 */

/**
 * @typedef {Object} PatchSetProp
 * @property {"SET_PROP"} kind
 * @property {number[]} path
 * @property {string} key
 * @property {string} value
 */

/**
 * @typedef {Object} PatchRemoveProp
 * @property {"REMOVE_PROP"} kind
 * @property {number[]} path
 * @property {string} key
 */

/**
 * @typedef {PatchCreate|PatchRemove|PatchReplace|PatchText|PatchSetProp|PatchRemoveProp} Patch
 */

/** @type {WeakMap<object, string>} */
const nodeSigCache = new WeakMap();

/**
 * @param {VNode} oldVNode
 * @param {VNode} newVNode
 * @returns {Patch[]}
 */
export function diff(oldVNode, newVNode) {
  /** @type {Patch[]} */
  const patches = [];
  diffNode(oldVNode, newVNode, [], patches);
  return patches;
}

/**
 * @param {VNode | null | undefined} oldNode
 * @param {VNode | null | undefined} newNode
 * @param {number[]} path
 * @param {Patch[]} patches
 */
function diffNode(oldNode, newNode, path, patches) {
  if (oldNode == null && newNode == null) {
    return;
  }

  if (oldNode === newNode) {
    return;
  }

  if (oldNode == null) {
    patches.push({
      kind: "CREATE",
      path: [...path],
      node: newNode,
    });
    return;
  }

  if (newNode == null) {
    patches.push({
      kind: "REMOVE",
      path: [...path],
    });
    return;
  }

  if (oldNode.nodeKind !== newNode.nodeKind || oldNode.type !== newNode.type) {
    patches.push({
      kind: "REPLACE",
      path: [...path],
      node: newNode,
    });
    return;
  }

  if (nodeSignature(oldNode) === nodeSignature(newNode)) {
    return;
  }

  if (oldNode.nodeKind === NODE_KIND.TEXT) {
    if (oldNode.text !== newNode.text) {
      patches.push({
        kind: "TEXT",
        path: [...path],
        text: String(newNode.text ?? ""),
      });
    }
    return;
  }

  diffProps(oldNode, newNode, path, patches);
  diffChildren(oldNode, newNode, path, patches);
}

/**
 * @param {VNode} vnode
 * @returns {string}
 */
function nodeSignature(vnode) {
  const cached = nodeSigCache.get(vnode);
  if (cached !== undefined) {
    return cached;
  }

  if (vnode.nodeKind === NODE_KIND.TEXT) {
    const sig = `TEXT:${vnode.text ?? ""}`;
    nodeSigCache.set(vnode, sig);
    return sig;
  }

  const props = vnode.props || {};
  const propEntries = Object.keys(props)
    .sort()
    .map((key) => `${key}=${String(props[key])}`)
    .join(";");
  const childrenSig = (vnode.children || [])
    .map((child) => nodeSignature(child))
    .join("|");
  const sig = `EL:${vnode.type}|P:${propEntries}|C:[${childrenSig}]`;
  nodeSigCache.set(vnode, sig);
  return sig;
}

/**
 * @param {VNode} oldNode
 * @param {VNode} newNode
 * @param {number[]} path
 * @param {Patch[]} patches
 */
function diffProps(oldNode, newNode, path, patches) {
  const oldProps = oldNode.props || {};
  const newProps = newNode.props || {};

  if (oldProps === newProps) {
    return;
  }

  const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
  for (const key of keys) {
    const oldValue = oldProps[key];
    const hasOld = Object.prototype.hasOwnProperty.call(oldProps, key);
    const hasNew = Object.prototype.hasOwnProperty.call(newProps, key);

    if (!hasOld && hasNew) {
      patches.push({
        kind: "SET_PROP",
        path: [...path],
        key,
        value: String(newProps[key]),
      });
      continue;
    }

    if (hasOld && !hasNew) {
      patches.push({
        kind: "REMOVE_PROP",
        path: [...path],
        key,
      });
      continue;
    }

    if (oldValue !== newProps[key]) {
      patches.push({
        kind: "SET_PROP",
        path: [...path],
        key,
        value: String(newProps[key]),
      });
    }
  }
}

/**
 * @param {VNode} oldNode
 * @param {VNode} newNode
 * @param {number[]} path
 * @param {Patch[]} patches
 */
function diffChildren(oldNode, newNode, path, patches) {
  const oldChildren = oldNode.children || [];
  const newChildren = newNode.children || [];

  if (oldChildren.length === 0 && newChildren.length === 0) {
    return;
  }

  const oldAllKeyed = oldChildren.length > 0 && oldChildren.every((c) => c && c.key != null);
  const newAllKeyed = newChildren.length > 0 && newChildren.every((c) => c && c.key != null);

  if (oldAllKeyed && newAllKeyed && hasUniqueKeys(oldChildren) && hasUniqueKeys(newChildren)) {
    diffChildrenByKeyedLIS(oldChildren, newChildren, path, patches);
    return;
  }

  const oldLen = oldChildren.length;
  const newLen = newChildren.length;
  const count = oldLen > newLen ? oldLen : newLen;

  for (let i = 0; i < count; i += 1) {
    path.push(i);
    if (i >= oldLen) {
      diffNode(null, newChildren[i], path, patches);
    } else if (i >= newLen) {
      diffNode(oldChildren[i], null, path, patches);
    } else {
      diffNode(oldChildren[i], newChildren[i], path, patches);
    }
    path.pop();
  }
}

/**
 * @param {VNode[]} oldChildren
 * @param {VNode[]} newChildren
 * @param {number[]} path
 * @param {Patch[]} patches
 */
function diffChildrenByKeyedLIS(oldChildren, newChildren, path, patches) {
  const oldByKey = new Map();
  for (let i = 0; i < oldChildren.length; i += 1) {
    oldByKey.set(oldChildren[i].key, i);
  }
  const newByKey = new Map();
  for (let i = 0; i < newChildren.length; i += 1) {
    newByKey.set(newChildren[i].key, i);
  }

  const oldInNew = new Set();
  const oldIndexByNewIndex = [];
  for (let i = 0; i < newChildren.length; i += 1) {
    const key = newChildren[i].key;
    if (oldByKey.has(key)) {
      const oldIndex = oldByKey.get(key);
      oldInNew.add(oldIndex);
      oldIndexByNewIndex.push(oldIndex);
    } else {
      oldIndexByNewIndex.push(-1);
    }
  }

  const lis = longestIncreasingSubsequence(oldIndexByNewIndex.filter((value) => value >= 0));
  const keepOldIndexes = new Set(lis);

  const removed = [];
  for (let i = 0; i < oldChildren.length; i += 1) {
    if (!oldInNew.has(i)) {
      removed.push(i);
      continue;
    }

    const key = oldChildren[i].key;
    const newIndex = newByKey.get(key);
    if (newIndex === undefined) {
      removed.push(i);
      continue;
    }

    if (!lis.includes(i)) {
      removed.push(i);
    }
  }

  removed.sort((a, b) => b - a);
  for (const oldIndex of removed) {
    path.push(oldIndex);
    diffNode(oldChildren[oldIndex], null, path, patches);
    path.pop();
  }

  for (let newIndex = 0; newIndex < newChildren.length; newIndex += 1) {
    const oldIndex = oldIndexByNewIndex[newIndex];
    const newChild = newChildren[newIndex];
    const mappedIndex = lis.indexOf(oldIndex);
    if (oldIndex >= 0 && mappedIndex >= 0) {
      path.push(newIndex);
      diffNode(oldChildren[oldIndex], newChild, path, patches);
      path.pop();
      continue;
    }

    path.push(newIndex);
    diffNode(null, newChild, path, patches);
    path.pop();
  }
}

/**
 * Build LIS values array from numeric array values, returning original values that are part
 * of a strictly increasing subsequence with max length.
 * This is the patience/LIS method used in tree-diff reordering heuristics.
 *
 * @param {number[]} values
 * @returns {number[]}
 */
function longestIncreasingSubsequence(values) {
  const n = values.length;
  const tails = [];
  const tailsIndexes = [];
  const predecessors = new Array(n).fill(-1);

  for (let i = 0; i < n; i += 1) {
    const value = values[i];
    let lo = 0;
    let hi = tails.length;

    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] >= value) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
      ;
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

  const lis = [];
  let curr = tailsIndexes[tails.length - 1];
  while (curr !== -1 && curr < n && curr >= 0) {
    lis.push(values[curr]);
    curr = predecessors[curr];
  }
  return lis.reverse();
}

/**
 * @param {VNode[]} nodes
 * @returns {boolean}
 */
function hasUniqueKeys(nodes) {
  const seen = new Set();
  for (const node of nodes) {
    if (node == null || node.key == null) {
      return false;
    }
    if (seen.has(node.key)) {
      return false;
    }
    seen.add(node.key);
  }
  return true;
}
