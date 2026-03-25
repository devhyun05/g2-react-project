import assert from "node:assert/strict";

import {
  bindControls,
  renderHistoryLog,
  renderPatchLog,
  renderVNodeTree,
  setStatusText,
  syncHistoryButtons,
} from "../../src/ui/bindings.js";
import { test } from "../helpers/testHarness.js";
import { installDOMGlobals } from "../helpers/fakeDom.js";
import { basicTree } from "../fixtures/sampleTrees.js";

test("syncHistoryButtons disables and enables controls based on history index", () => {
  const document = installDOMGlobals();
  const undoButton = document.createElement("button");
  const redoButton = document.createElement("button");

  syncHistoryButtons({ undoButton, redoButton }, null);
  assert.equal(undoButton.disabled, true);
  assert.equal(redoButton.disabled, true);

  syncHistoryButtons(
    { undoButton, redoButton },
    { entries: [1, 2, 3], index: 1 },
  );
  assert.equal(undoButton.disabled, false);
  assert.equal(redoButton.disabled, false);
});

test("renderPatchLog and renderHistoryLog write readable debug text", () => {
  const document = installDOMGlobals();
  const target = document.createElement("pre");

  renderPatchLog(target, []);
  assert.match(target.textContent, /patch/);

  renderPatchLog(target, [{ kind: "TEXT", path: [0], text: "changed" }]);
  assert.match(target.textContent, /TEXT/);

  renderHistoryLog(target, "Undo", 2, 1);
  assert.match(target.textContent, /Undo/);
  assert.match(target.textContent, /from index: 2/);
});

test("renderVNodeTree handles empty and nested vnode data", () => {
  const document = installDOMGlobals();
  const target = document.createElement("div");

  renderVNodeTree(target, null);
  assert.match(target.textContent, /\(empty\)/);

  renderVNodeTree(target, basicTree);
  assert.match(target.textContent, /section/);
  assert.match(target.textContent, /Weekly menu/);
});

test("bindControls wires handlers to button clicks and setStatusText updates labels", () => {
  const document = installDOMGlobals();
  const patchButton = document.createElement("button");
  const undoButton = document.createElement("button");
  const redoButton = document.createElement("button");
  const status = document.createElement("span");
  const events = [];

  bindControls(
    { patchButton, undoButton, redoButton },
    {
      onPatch: () => events.push("patch"),
      onUndo: () => events.push("undo"),
      onRedo: () => events.push("redo"),
    },
  );

  patchButton.click();
  undoButton.click();
  redoButton.click();
  setStatusText(status, "ready");

  assert.deepEqual(events, ["patch", "undo", "redo"]);
  assert.equal(status.textContent, "ready");
});
