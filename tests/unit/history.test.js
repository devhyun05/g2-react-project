import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import {
  createHistory,
  getCurrentVNode,
  pushHistory,
  redoHistory,
  undoHistory,
} from "../../src/core/history.js";
import { basicTree, replacedRootTree, updatedTree } from "../fixtures/sampleTrees.js";

test("history keeps snapshots immutable across reads", () => {
  const history = createHistory(basicTree);
  const current = getCurrentVNode(history);
  current.props.className = "mutated";

  assert.equal(getCurrentVNode(history).props.className, "card");
});

test("history undo then push truncates future entries", () => {
  const first = createHistory(basicTree);
  const second = pushHistory(first, updatedTree);
  const third = pushHistory(second, replacedRootTree);
  const undone = undoHistory(third);
  const rebuilt = pushHistory(undone, basicTree);

  assert.equal(rebuilt.entries.length, 3);
  assert.deepEqual(rebuilt.entries[2], basicTree);
  assert.equal(redoHistory(rebuilt).index, rebuilt.index);
});

test("history gracefully normalizes malformed state", () => {
  const malformed = { entries: "bad", index: 999 };
  const next = pushHistory(malformed, basicTree);

  assert.equal(next.index, 0);
  assert.deepEqual(getCurrentVNode(next), basicTree);
});

test("createHistory clones the initial snapshot instead of storing external references", () => {
  const source = structuredClone(basicTree);
  const history = createHistory(source);
  source.props.className = "changed-outside";

  assert.equal(history.entries[0].props.className, "card");
});
