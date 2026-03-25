import {
  bindControls,
  renderHistoryLog,
  renderPatchLog,
  renderVNodeTree,
  setStatusText,
  syncHistoryButtons,
} from "./bindings.js";
import { fallbackMessages } from "./fixtures.js";

const elementIds = {
  realRoot: "real-root",
  testRoot: "test-root",
  patchButton: "patch-button",
  undoButton: "undo-button",
  redoButton: "redo-button",
  statusText: "status-text",
  vnodeTree: "vnode-tree",
  patchLog: "patch-log",
};

async function loadCoreModules() {
  const [
    { domToVNode },
    { render },
    { diff },
    { applyPatches },
    { createHistory, getCurrentVNode, pushHistory, redoHistory, undoHistory },
  ] = await Promise.all([
    import("../core/domToVNode.js"),
    import("../core/render.js"),
    import("../core/diff.js"),
    import("../core/patch.js"),
    import("../core/history.js"),
  ]);

  return {
    domToVNode,
    render,
    diff,
    applyPatches,
    createHistory,
    getCurrentVNode,
    pushHistory,
    redoHistory,
    undoHistory,
  };
}

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

/**
 * @param {HTMLElement} container
 * @returns {Node}
 */
function getRootNode(container) {
  const childNodes = Array.from(container.childNodes);
  const rootNode = childNodes.find((node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      return true;
    }

    return node.textContent?.trim();
  });

  if (!rootNode) {
    throw new Error(fallbackMessages.missingRoot);
  }

  return rootNode;
}

/**
 * @param {unknown} vnode
 * @param {(vnode: unknown, container: HTMLElement) => Node} render
 * @returns {string}
 */
function vnodeToHTML(vnode, render) {
  const container = document.createElement("div");
  render(cloneValue(vnode), container);
  return container.innerHTML.trim();
}

/**
 * @param {string} html
 * @returns {Node}
 */
function parseHTMLRoot(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  const nodes = Array.from(template.content.childNodes).filter((node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      return true;
    }

    return node.textContent?.trim();
  });

  if (nodes.length !== 1) {
    throw new Error(fallbackMessages.invalidHtmlRoot);
  }

  return nodes[0];
}

/**
 * @param {{
 *   realRoot: HTMLElement,
 *   testRoot: HTMLTextAreaElement,
 *   vnodeTree: HTMLElement,
 *   patchLog: HTMLElement,
 *   patchButton: HTMLButtonElement,
 *   undoButton: HTMLButtonElement,
 *   redoButton: HTMLButtonElement,
 *   statusText: HTMLElement
 * }} elements
 * @param {{
 *   domToVNode: (domNode: Node) => unknown,
 *   render: (vnode: unknown, container: HTMLElement) => Node,
 *   diff: (oldVNode: unknown, newVNode: unknown) => unknown[],
 *   applyPatches: (rootEl: Node, patches: unknown[]) => void,
 *   createHistory: (initialVNode: unknown) => { entries: unknown[], index: number },
 *   getCurrentVNode: (history: { entries: unknown[], index: number }) => unknown,
 *   pushHistory: (history: { entries: unknown[], index: number }, nextVNode: unknown) => { entries: unknown[], index: number },
 *   redoHistory: (history: { entries: unknown[], index: number }) => { entries: unknown[], index: number },
 *   undoHistory: (history: { entries: unknown[], index: number }) => { entries: unknown[], index: number }
 * }} core
 */
function createPlayground(elements, core) {
  let history = null;

  function syncButtons() {
    syncHistoryButtons(
      {
        undoButton: elements.undoButton,
        redoButton: elements.redoButton,
      },
      history,
    );
  }

  function renderTree(vnode) {
    renderVNodeTree(elements.vnodeTree, vnode);
  }

  function renderBoth(vnode) {
    core.render(cloneValue(vnode), elements.realRoot);
    elements.testRoot.value = vnodeToHTML(vnode, core.render);
    renderTree(vnode);
  }

  function initialize() {
    const initialVNode = core.domToVNode(getRootNode(elements.realRoot));
    elements.testRoot.value = vnodeToHTML(initialVNode, core.render);
    history = core.createHistory(cloneValue(initialVNode));
    renderTree(initialVNode);
    renderPatchLog(elements.patchLog, []);
    syncButtons();
    setStatusText(elements.statusText, fallbackMessages.ready);
  }

  function handlePatch() {
    try {
      const previousVNode = core.getCurrentVNode(history);
      const nextRootNode = parseHTMLRoot(elements.testRoot.value);
      const nextVNode = core.domToVNode(nextRootNode);
      const patches = core.diff(previousVNode, nextVNode);

      console.log("[Patch]", patches);

      if (patches.length === 0) {
        renderPatchLog(elements.patchLog, patches);
        renderTree(nextVNode);
        setStatusText(elements.statusText, fallbackMessages.noPatchChanges);
        return;
      }

      core.applyPatches(getRootNode(elements.realRoot), patches);
      history = core.pushHistory(history, cloneValue(nextVNode));
      elements.testRoot.value = vnodeToHTML(nextVNode, core.render);
      renderTree(nextVNode);
      renderPatchLog(elements.patchLog, patches);
      syncButtons();
      setStatusText(elements.statusText, fallbackMessages.patchApplied(patches.length));
    } catch (error) {
      console.error("[Patch Parse Error]", error);
      setStatusText(
        elements.statusText,
        error instanceof Error ? error.message : fallbackMessages.invalidHtmlParse,
      );
    }
  }

  function handleUndo() {
    const previousIndex = history.index;
    const nextHistory = core.undoHistory(history);

    if (nextHistory.index === history.index) {
      setStatusText(elements.statusText, fallbackMessages.noUndo);
      return;
    }

    const nextVNode = core.getCurrentVNode(nextHistory);
    history = nextHistory;
    renderBoth(nextVNode);
    renderHistoryLog(elements.patchLog, "뒤로가기", previousIndex, nextHistory.index);
    syncButtons();
    setStatusText(elements.statusText, fallbackMessages.undoApplied);
  }

  function handleRedo() {
    const previousIndex = history.index;
    const nextHistory = core.redoHistory(history);

    if (nextHistory.index === history.index) {
      setStatusText(elements.statusText, fallbackMessages.noRedo);
      return;
    }

    const nextVNode = core.getCurrentVNode(nextHistory);
    history = nextHistory;
    renderBoth(nextVNode);
    renderHistoryLog(elements.patchLog, "앞으로가기", previousIndex, nextHistory.index);
    syncButtons();
    setStatusText(elements.statusText, fallbackMessages.redoApplied);
  }

  bindControls(
    {
      patchButton: elements.patchButton,
      undoButton: elements.undoButton,
      redoButton: elements.redoButton,
    },
    {
      onPatch: handlePatch,
      onUndo: handleUndo,
      onRedo: handleRedo,
    },
  );

  initialize();
}

function getRequiredElement(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`필수 요소를 찾지 못했습니다: #${id}`);
  }

  return element;
}

async function main() {
  const elements = {
    realRoot: /** @type {HTMLElement} */ (getRequiredElement(elementIds.realRoot)),
    testRoot: /** @type {HTMLTextAreaElement} */ (getRequiredElement(elementIds.testRoot)),
    vnodeTree: /** @type {HTMLElement} */ (getRequiredElement(elementIds.vnodeTree)),
    patchLog: /** @type {HTMLElement} */ (getRequiredElement(elementIds.patchLog)),
    patchButton: /** @type {HTMLButtonElement} */ (getRequiredElement(elementIds.patchButton)),
    undoButton: /** @type {HTMLButtonElement} */ (getRequiredElement(elementIds.undoButton)),
    redoButton: /** @type {HTMLButtonElement} */ (getRequiredElement(elementIds.redoButton)),
    statusText: /** @type {HTMLElement} */ (getRequiredElement(elementIds.statusText)),
  };

  renderPatchLog(elements.patchLog, []);
  syncHistoryButtons(
    {
      undoButton: elements.undoButton,
      redoButton: elements.redoButton,
    },
    null,
  );
  setStatusText(elements.statusText, fallbackMessages.loading);

  try {
    const core = await loadCoreModules();
    createPlayground(elements, core);
  } catch (error) {
    console.error("[Playground Init Error]", error);
    elements.patchButton.disabled = true;
    elements.undoButton.disabled = true;
    elements.redoButton.disabled = true;
    renderVNodeTree(elements.vnodeTree, null);
    renderPatchLog(elements.patchLog, []);
    setStatusText(elements.statusText, fallbackMessages.importError);
  }
}

main();
