import test from "node:test";
import assert from "node:assert/strict";

import { createTextVNode, createVNode } from "../../src/core/types.js";

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
