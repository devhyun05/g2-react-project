import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import { createTextVNode, createVNode } from "../../src/core/types.js";

test("VNode contract keeps props and children as objects and arrays", () => {
  const vnode = createVNode("div", null, null);

  assert.deepEqual(vnode, {
    type: "div",
    props: {},
    children: [],
  });
});

test('TEXT VNode contract uses type "TEXT" and props.nodeValue', () => {
  const vnode = createTextVNode(123);

  assert.deepEqual(vnode, {
    type: "TEXT",
    props: { nodeValue: "123" },
    children: [],
  });
});
