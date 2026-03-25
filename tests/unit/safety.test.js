import assert from "node:assert/strict";

import {
  getPatchSafetyFallback,
  hasUnsupportedReorder,
  measureVNode,
  validateVNodeSafety,
} from "../../src/ui/safety.js";
import { test } from "../helpers/testHarness.js";
import { basicTree, updatedTree } from "../fixtures/sampleTrees.js";
import { createListTree, createNestedTree } from "../helpers/treeFactory.js";

test("measureVNode counts nodes and depth for nested trees", () => {
  const stats = measureVNode(createNestedTree(3, 2));

  assert.ok(stats.nodes > 0);
  assert.ok(stats.depth >= 4);
});

test("validateVNodeSafety rejects unsupported interactive form controls", () => {
  const result = validateVNodeSafety({
    type: "section",
    props: {},
    children: [{ type: "input", props: { value: "x" }, children: [] }],
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /input/);
});

test("validateVNodeSafety rejects very large and very deep trees", () => {
  const largeResult = validateVNodeSafety(createListTree(401));
  const deepResult = validateVNodeSafety(createNestedTree(30, 1));

  assert.equal(largeResult.ok, false);
  assert.match(largeResult.reason, /too large/i);
  assert.equal(deepResult.ok, false);
  assert.match(deepResult.reason, /too deep/i);
});

test("hasUnsupportedReorder detects same children moved to a different order", () => {
  const oldTree = {
    type: "ul",
    props: {},
    children: [
      { type: "li", props: { id: "a" }, children: [] },
      { type: "li", props: { id: "b" }, children: [] },
    ],
  };
  const newTree = {
    type: "ul",
    props: {},
    children: [
      { type: "li", props: { id: "b" }, children: [] },
      { type: "li", props: { id: "a" }, children: [] },
    ],
  };

  assert.equal(hasUnsupportedReorder(oldTree, newTree), true);
});

test("getPatchSafetyFallback requests full render for root replace and heavy patch sets only", () => {
  const reorderTree = {
    type: "ul",
    props: {},
    children: [
      { type: "li", props: { id: "a" }, children: [] },
      { type: "li", props: { id: "b" }, children: [] },
    ],
  };
  const reordered = {
    type: "ul",
    props: {},
    children: [
      { type: "li", props: { id: "b" }, children: [] },
      { type: "li", props: { id: "a" }, children: [] },
    ],
  };

  assert.equal(getPatchSafetyFallback(reorderTree, reordered, []).useFullRender, false);
  assert.equal(
    getPatchSafetyFallback(basicTree, updatedTree, [{ kind: "REPLACE", path: [], node: updatedTree }])
      .useFullRender,
    true,
  );
  assert.equal(
    getPatchSafetyFallback(
      basicTree,
      updatedTree,
      Array.from({ length: 161 }, () => ({ kind: "TEXT", path: [0], text: "x" })),
    ).useFullRender,
    true,
  );
});
