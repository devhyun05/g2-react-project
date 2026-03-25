import { cloneWithVNodeMetadata } from "./identity.js";

/**
 * @param {any} value
 * @returns {any}
 */
function cloneSnapshot(value) {
  if (typeof value === "undefined") return undefined;
  return cloneWithVNodeMetadata(value);
}

/**
 * @param {any} history
 * @returns {{ entries: any[], index: number }}
 */
function normalizeHistory(history) {
  if (!history || !Array.isArray(history.entries)) {
    return { entries: [], index: -1 };
  }

  const entries = history.entries.slice();
  if (entries.length === 0) {
    return { entries, index: -1 };
  }

  let index = Number.isInteger(history.index) ? history.index : entries.length - 1;
  if (index < 0) index = 0;
  if (index >= entries.length) index = entries.length - 1;

  return { entries, index };
}

/**
 * @param {any} [initialVNode]
 * @returns {{ entries: any[], index: number }}
 */
export function createHistory(initialVNode) {
  if (typeof initialVNode === "undefined") {
    return { entries: [], index: -1 };
  }

  return {
    entries: [cloneSnapshot(initialVNode)],
    index: 0,
  };
}

/**
 * undo 이후 push 시 future entries를 제거한다.
 * @param {{ entries: any[], index: number }} history
 * @param {any} nextVNode
 * @returns {{ entries: any[], index: number }}
 */
export function pushHistory(history, nextVNode) {
  const normalized = normalizeHistory(history);
  if (typeof nextVNode === "undefined") {
    return normalized;
  }

  const trimmedEntries = normalized.entries.slice(0, normalized.index + 1);
  trimmedEntries.push(cloneSnapshot(nextVNode));

  return {
    entries: trimmedEntries,
    index: trimmedEntries.length - 1,
  };
}

/**
 * @param {{ entries: any[], index: number }} history
 * @returns {{ entries: any[], index: number }}
 */
export function undoHistory(history) {
  const normalized = normalizeHistory(history);
  if (normalized.index <= 0) {
    return normalized;
  }

  return {
    entries: normalized.entries,
    index: normalized.index - 1,
  };
}

/**
 * @param {{ entries: any[], index: number }} history
 * @returns {{ entries: any[], index: number }}
 */
export function redoHistory(history) {
  const normalized = normalizeHistory(history);
  if (normalized.index < 0 || normalized.index >= normalized.entries.length - 1) {
    return normalized;
  }

  return {
    entries: normalized.entries,
    index: normalized.index + 1,
  };
}

/**
 * @param {{ entries: any[], index: number }} history
 * @returns {any|null}
 */
export function getCurrentVNode(history) {
  const normalized = normalizeHistory(history);
  if (normalized.index < 0 || normalized.index >= normalized.entries.length) {
    return null;
  }

  return cloneSnapshot(normalized.entries[normalized.index]);
}

export default {
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  getCurrentVNode,
};
