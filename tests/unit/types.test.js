import assert from "node:assert/strict";
import { createTextVNode, createVNode } from "../../src/core/types.js";
import { test } from "../helpers/testHarness.js";

test("createVNode normalizes missing props and children to the contract defaults", () => {
  assert.deepEqual(createVNode("div", null, null), {
    type: "div",
    props: {},
    children: [],
  });
});

test("createTextVNode stringifies numbers into props.nodeValue", () => {
  assert.deepEqual(createTextVNode(123), {
    type: "TEXT",
    props: { nodeValue: "123" },
    children: [],
  });
});
