import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import { domToVNode } from "../../src/core/domToVNode.js";
import { installDOMGlobals } from "../helpers/fakeDom.js";
import { createSampleDOMTree } from "../fixtures/sampleDom.js";

test("domToVNode converts DOM to the agreed VNode shape", () => {
  installDOMGlobals();
  const { root } = createSampleDOMTree();

  const vnode = domToVNode(root);

  assert.deepEqual(vnode, {
    type: "section",
    props: { className: "card", "data-kind": "article" },
    children: [
      {
        type: "h2",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "Weekly menu" }, children: [] }],
      },
      {
        type: "p",
        props: { className: "lead" },
        children: [{ type: "TEXT", props: { nodeValue: "Kimchi stew" }, children: [] }],
      },
      {
        type: "ul",
        props: {},
        children: [
          { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "Egg roll" }, children: [] }] },
          { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "Seaweed soup" }, children: [] }] }
        ],
      },
    ],
  });
});

test("domToVNode preserves extreme text cases including empty strings and whitespace", () => {
  const document = installDOMGlobals();
  const root = document.createElement("div");
  root.appendChild(document.createTextNode(""));
  root.appendChild(document.createTextNode(" "));
  root.appendChild(document.createComment("ignored"));

  const vnode = domToVNode(root);

  assert.deepEqual(vnode.children, [
    { type: "TEXT", props: { nodeValue: "" }, children: [] },
    { type: "TEXT", props: { nodeValue: " " }, children: [] },
  ]);
});

test("domToVNode ignores event-like attributes and returns null for unsupported nodes", () => {
  const document = installDOMGlobals();
  const button = document.createElement("button");
  button.setAttribute("onclick", "alert('x')");
  button.setAttribute("data-id", "10");

  const vnode = domToVNode(button);

  assert.deepEqual(vnode, {
    type: "button",
    props: { "data-id": "10" },
    children: [],
  });
  assert.equal(domToVNode(document.createComment("skip")), null);
  assert.equal(domToVNode(null), null);
});
