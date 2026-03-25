import { bindControls, renderChecklist, setStatusText, syncHistoryButtons } from "./bindings.js";
import { fallbackMessages, manualQaChecklist } from "./fixtures.js";

const elementIds = {
  realRoot: "real-root",
  testRoot: "test-root",
  patchButton: "patch-button",
  undoButton: "undo-button",
  redoButton: "redo-button",
  statusText: "status-text",
  qaChecklist: "qa-checklist",
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
 * @param {{
 *   realRoot: HTMLElement,
 *   testRoot: HTMLElement,
 *   patchButton: HTMLButtonElement,
 *   undoButton: HTMLButtonElement,
 *   redoButton: HTMLButtonElement,
 *   statusText: HTMLElement,
 *   qaChecklist: HTMLElement
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

  function renderBoth(vnode) {
    core.render(cloneValue(vnode), elements.realRoot);
    core.render(cloneValue(vnode), elements.testRoot);
  }

  function initialize() {
    const initialVNode = core.domToVNode(getRootNode(elements.realRoot));
    core.render(cloneValue(initialVNode), elements.testRoot);
    history = core.createHistory(cloneValue(initialVNode));
    syncButtons();
    setStatusText(elements.statusText, fallbackMessages.ready);
  }

  function handlePatch() {
    const previousVNode = core.getCurrentVNode(history);
    const nextVNode = core.domToVNode(getRootNode(elements.testRoot));
    const patches = core.diff(previousVNode, nextVNode);

    console.log("[Patch]", patches);
    core.applyPatches(getRootNode(elements.realRoot), patches);
    history = core.pushHistory(history, cloneValue(nextVNode));
    syncButtons();
    setStatusText(elements.statusText, fallbackMessages.patchApplied(patches.length));
  }

  function handleUndo() {
    const nextHistory = core.undoHistory(history);

    if (nextHistory.index === history.index) {
      setStatusText(elements.statusText, fallbackMessages.noUndo);
      return;
    }

    history = nextHistory;
    renderBoth(core.getCurrentVNode(history));
    syncButtons();
    setStatusText(elements.statusText, fallbackMessages.undoApplied);
  }

  function handleRedo() {
    const nextHistory = core.redoHistory(history);

    if (nextHistory.index === history.index) {
      setStatusText(elements.statusText, fallbackMessages.noRedo);
      return;
    }

    history = nextHistory;
    renderBoth(core.getCurrentVNode(history));
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
    testRoot: /** @type {HTMLElement} */ (getRequiredElement(elementIds.testRoot)),
    patchButton: /** @type {HTMLButtonElement} */ (getRequiredElement(elementIds.patchButton)),
    undoButton: /** @type {HTMLButtonElement} */ (getRequiredElement(elementIds.undoButton)),
    redoButton: /** @type {HTMLButtonElement} */ (getRequiredElement(elementIds.redoButton)),
    statusText: /** @type {HTMLElement} */ (getRequiredElement(elementIds.statusText)),
    qaChecklist: /** @type {HTMLElement} */ (getRequiredElement(elementIds.qaChecklist)),
  };

  renderChecklist(elements.qaChecklist, manualQaChecklist);
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
    setStatusText(elements.statusText, fallbackMessages.importError);
  }
}

main();
