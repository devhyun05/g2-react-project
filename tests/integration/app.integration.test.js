import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import { diff } from "../../src/core/diff.js";
import { domToVNode } from "../../src/core/domToVNode.js";
import {
  createHistory,
  getCurrentVNode,
  pushHistory,
  redoHistory,
  undoHistory,
} from "../../src/core/history.js";
import { applyPatches } from "../../src/core/patch.js";
import { render } from "../../src/core/render.js";
import {
  bindControls,
  renderPatchLog,
  renderVNodeTree,
  setStatusText,
  syncHistoryButtons,
} from "../../src/ui/bindings.js";
import { fallbackMessages } from "../../src/ui/fixtures.js";
import { basicTree, updatedTree } from "../fixtures/sampleTrees.js";
import { createPlaygroundElements } from "../fixtures/sampleDom.js";
import { installDOMGlobals, serializeNode } from "../helpers/fakeDom.js";

test("integration flow keeps real DOM, test DOM, patch log, and history in sync", () => {
  const document = installDOMGlobals();
  const elements = createPlaygroundElements(document);

  render(basicTree, elements.realRoot);
  let history = createHistory(domToVNode(elements.realRoot.childNodes[0]));

  render(updatedTree, elements.realRoot);
  elements.testRoot.value = serializeNode(elements.realRoot.childNodes[0]);

  const currentVNode = getCurrentVNode(history);
  const nextVNode = domToVNode(elements.realRoot.childNodes[0]);
  const patches = diff(currentVNode, nextVNode);

  render(basicTree, elements.realRoot);
  applyPatches(elements.realRoot.childNodes[0], patches);
  history = pushHistory(history, nextVNode);

  renderPatchLog(elements.patchLog, patches);
  renderVNodeTree(elements.vnodeTree, nextVNode);
  setStatusText(elements.statusText, fallbackMessages.patchApplied(patches.length));
  syncHistoryButtons(
    { undoButton: elements.undoButton, redoButton: elements.redoButton },
    history,
  );

  assert.equal(
    serializeNode(elements.realRoot.childNodes[0]),
    '<section class="card featured" data-kind="article"><h2>Weekly menu</h2><p class="lead">Soybean paste stew</p><ul><li>Egg roll</li><li>Seaweed soup</li><li>Seasonal fruit</li></ul></section>',
  );
  assert.match(elements.patchLog.textContent, /SET_PROP/);
  assert.match(elements.patchLog.textContent, /CREATE/);
  assert.match(elements.vnodeTree.textContent, /section/);
  assert.equal(elements.statusText.textContent, fallbackMessages.patchApplied(patches.length));
  assert.equal(elements.undoButton.disabled, false);
  assert.equal(elements.redoButton.disabled, true);
});

test("integration flow supports undo and redo through bound controls", () => {
  const document = installDOMGlobals();
  const elements = createPlaygroundElements(document);

  let history = createHistory(basicTree);
  history = pushHistory(history, updatedTree);

  function syncFromHistory(message) {
    const vnode = getCurrentVNode(history);
    render(vnode, elements.realRoot);
    elements.testRoot.value = serializeNode(elements.realRoot.childNodes[0]);
    renderVNodeTree(elements.vnodeTree, vnode);
    setStatusText(elements.statusText, message);
    syncHistoryButtons(
      { undoButton: elements.undoButton, redoButton: elements.redoButton },
      history,
    );
  }

  bindControls(
    {
      patchButton: elements.patchButton,
      undoButton: elements.undoButton,
      redoButton: elements.redoButton,
    },
    {
      onPatch: () => {},
      onUndo: () => {
        const currentVNode = getCurrentVNode(history);
        history = undoHistory(history);
        const nextVNode = getCurrentVNode(history);
        const patches = diff(currentVNode, nextVNode);
        syncFromHistory(fallbackMessages.undoApplied);
        renderPatchLog(elements.patchLog, patches);
      },
      onRedo: () => {
        const currentVNode = getCurrentVNode(history);
        history = redoHistory(history);
        const nextVNode = getCurrentVNode(history);
        const patches = diff(currentVNode, nextVNode);
        syncFromHistory(fallbackMessages.redoApplied);
        renderPatchLog(elements.patchLog, patches);
      },
    },
  );

  syncFromHistory("ready");
  elements.undoButton.click();

  assert.match(elements.patchLog.textContent, /TEXT/);
  assert.equal(elements.statusText.textContent, fallbackMessages.undoApplied);
  assert.equal(elements.testRoot.value, '<section class="card" data-kind="article"><h2>Weekly menu</h2><p class="lead">Kimchi stew</p><ul><li>Egg roll</li><li>Seaweed soup</li></ul></section>');
  assert.equal(elements.undoButton.disabled, true);
  assert.equal(elements.redoButton.disabled, false);

  elements.redoButton.click();

  assert.match(elements.patchLog.textContent, /TEXT/);
  assert.match(elements.patchLog.textContent, /CREATE/);
  assert.equal(elements.statusText.textContent, fallbackMessages.redoApplied);
  assert.equal(elements.redoButton.disabled, true);
});
