import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import { diff } from "../../src/core/diff.js";
import {
  createHistory,
  getCurrentVNode,
  pushHistory,
  redoHistory,
  undoHistory,
} from "../../src/core/history.js";
import { applyPatches } from "../../src/core/patch.js";
import { render } from "../../src/core/render.js";
import { bindControls } from "../../src/ui/bindings.js";
import { test } from "../helpers/testHarness.js";
import { installDOMGlobals, serializeNode } from "../helpers/fakeDom.js";
import { basicTree, updatedTree } from "../fixtures/sampleTrees.js";
import {
  createListTree,
  createMutatedListTree,
  createNestedTree,
} from "../helpers/treeFactory.js";
import { vNodeToDOM } from "../../src/core/vNodeToDOM.js";

test("interleaved history operations on separate states do not bleed into each other", async () => {
  const historyA = createHistory(basicTree);
  const historyB = createHistory(updatedTree);

  const [resultA, resultB] = await Promise.all([
    Promise.resolve().then(() => {
      let next = pushHistory(historyA, updatedTree);
      next = undoHistory(next);
      next = pushHistory(next, basicTree);
      return next;
    }),
    Promise.resolve().then(() => {
      let next = pushHistory(historyB, basicTree);
      next = redoHistory(next);
      next = undoHistory(next);
      return next;
    }),
  ]);

  assert.deepEqual(getCurrentVNode(resultA), basicTree);
  assert.deepEqual(getCurrentVNode(resultB), updatedTree);
  assert.equal(resultA.entries.length, 2);
  assert.equal(resultB.entries.length, 2);
});

test("rapid successive patch computations keep DOM deterministic", async () => {
  installDOMGlobals();
  const root = vNodeToDOM(createListTree(20));
  const targetA = createMutatedListTree(20, { changedEvery: 2, appendCount: 2 });
  const targetB = createMutatedListTree(22, { changedEvery: 4, prefix: "next" });

  await Promise.all([
    Promise.resolve().then(() => {
      applyPatches(root, diff(createListTree(20), targetA));
    }),
  ]);

  const intermediate = serializeNode(root);
  applyPatches(root, diff(targetA, targetB));

  assert.match(intermediate, /changed/);
  assert.equal(
    serializeNode(root),
    serializeNode(vNodeToDOM(targetB)),
  );
});

test("rapid bound control clicks keep handler order stable", () => {
  const document = installDOMGlobals();
  const patchButton = document.createElement("button");
  const undoButton = document.createElement("button");
  const redoButton = document.createElement("button");
  const events = [];

  bindControls(
    { patchButton, undoButton, redoButton },
    {
      onPatch: () => events.push("patch"),
      onUndo: () => events.push("undo"),
      onRedo: () => events.push("redo"),
    },
  );

  for (let index = 0; index < 50; index += 1) {
    patchButton.click();
    if (index % 2 === 0) {
      undoButton.click();
    }
    if (index % 5 === 0) {
      redoButton.click();
    }
  }

  assert.equal(events.length, 85);
  assert.deepEqual(events.slice(0, 6), ["patch", "undo", "redo", "patch", "patch", "undo"]);
});

test("load diff on a nested tree stays correct under larger input", () => {
  const oldTree = createNestedTree(5, 3, "load");
  const newTree = structuredClone(oldTree);

  newTree.children[1].children[2].props.className = "depth-2-hot";
  newTree.children[2].children[1].children[1].children[0].children[2].props.nodeValue =
    "load:mutation";

  const startedAt = performance.now();
  const patches = diff(oldTree, newTree);
  const elapsedMs = performance.now() - startedAt;

  assert.ok(patches.length >= 2);
  assert.ok(patches.some((patch) => patch.kind === "SET_PROP"));
  assert.ok(patches.some((patch) => patch.kind === "TEXT"));
  assert.ok(elapsedMs >= 0);
});

test("load patch loop preserves correctness over many sequential updates", () => {
  installDOMGlobals();
  const iterations = 40;
  let currentTree = createListTree(120);
  const root = vNodeToDOM(currentTree);
  const startedAt = performance.now();

  for (let index = 0; index < iterations; index += 1) {
    const nextTree = createMutatedListTree(120, {
      prefix: `round${index}`,
      changedEvery: (index % 5) + 2,
      appendCount: 0,
      className: `load-list phase-${index}`,
    });
    const patches = diff(currentTree, nextTree);
    applyPatches(root, patches);
    currentTree = nextTree;
  }

  const elapsedMs = performance.now() - startedAt;

  assert.equal(serializeNode(root), serializeNode(vNodeToDOM(currentTree)));
  assert.ok(elapsedMs >= 0);
});

test("load render/history loop keeps snapshots stable over repeated churn", () => {
  installDOMGlobals();
  const document = globalThis.document;
  const container = document.createElement("div");
  let history = createHistory(createListTree(50));
  const startedAt = performance.now();

  for (let index = 0; index < 60; index += 1) {
    const nextTree = createMutatedListTree(50, {
      prefix: `history-${index}`,
      changedEvery: 2 + (index % 4),
    });
    render(nextTree, container);
    history = pushHistory(history, nextTree);
    if (index % 4 === 0) {
      history = undoHistory(history);
      history = pushHistory(history, nextTree);
    }
  }

  const elapsedMs = performance.now() - startedAt;
  const current = getCurrentVNode(history);

  assert.equal(serializeNode(container.childNodes[0]), serializeNode(vNodeToDOM(current)));
  assert.ok(history.entries.length >= 50);
  assert.ok(elapsedMs >= 0);
});
