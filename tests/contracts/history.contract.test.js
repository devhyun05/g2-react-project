import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import {
  createHistory,
  getCurrentVNode,
  pushHistory,
  redoHistory,
  undoHistory,
} from "../../src/core/history.js";
import { basicTree, updatedTree } from "../fixtures/sampleTrees.js";

test("history contract uses entries/index shape and returns null when empty", () => {
  const history = createHistory();

  assert.deepEqual(history, { entries: [], index: -1 });
  assert.equal(getCurrentVNode(history), null);
});

test("history contract stores snapshots and preserves undo/redo shape", () => {
  const first = createHistory(basicTree);
  const second = pushHistory(first, updatedTree);
  const undone = undoHistory(second);
  const redone = redoHistory(undone);

  assert.deepEqual(Object.keys(redone), ["entries", "index"]);
  assert.equal(redone.entries.length, 2);
  assert.equal(redone.index, 1);
  assert.deepEqual(getCurrentVNode(undone), basicTree);
});
