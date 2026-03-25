import test from "node:test";
import assert from "node:assert/strict";
import { createHistory } from "../src/core/history.js";

test("phase1 history push/undo/redo", () => {
  const history = createHistory();
  history.push("a");
  history.push("b");
  history.push("c");
  assert.equal(history.current(), "c");
  assert.equal(history.undo(), "b");
  assert.equal(history.undo(), "a");
  assert.equal(history.canUndo(), false);
  assert.equal(history.redo(), "b");
  assert.equal(history.redo(), "c");
  assert.equal(history.canRedo(), false);
});

