import { NODE_KIND } from "./types.js";

/**
 * @typedef {import("./types.js").NODE_KIND} NODE_KIND
 */

/**
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

  if (oldNode == null) {
    patches.push({ kind: "CREATE", path: [...path], node: newNode });
    return;
  }

  if (newNode == null) {
    patches.push({ kind: "REMOVE", path: [...path] });
    return;
  }

  if (oldNode.nodeKind !== newNode.nodeKind || oldNode.type !== newNode.type) {
    patches.push({ kind: "REPLACE", path: [...path], node: newNode });
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
 * @param {VNode} oldNode
 * @param {VNode} newNode
 * @param {number[]} path
 * @param {Patch[]} patches
 */
function diffProps(oldNode, newNode, path, patches) {
  const oldProps = oldNode.props || {};
  const newProps = newNode.props || {};
  const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  for (const key of keys) {
    if (!(key in oldProps)) {
      patches.push({
        kind: "SET_PROP",
        path: [...path],
        key,
        value: String(newProps[key]),
      });
      continue;
    }

    if (!(key in newProps)) {
      patches.push({ kind: "REMOVE_PROP", path: [...path], key });
      continue;
    }

    if (oldProps[key] !== newProps[key]) {
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
  const count = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < count; i += 1) {
    const childPath = [...path, i];

    if (i >= oldChildren.length) {
      diffNode(null, newChildren[i], childPath, patches);
      continue;
    }

    if (i >= newChildren.length) {
      diffNode(oldChildren[i], null, childPath, patches);
      continue;
    }

    diffNode(oldChildren[i], newChildren[i], childPath, patches);
  }
}
