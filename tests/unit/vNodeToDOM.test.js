import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import { vNodeToDOM } from "../../src/core/vNodeToDOM.js";
import { installDOMGlobals, serializeNode } from "../helpers/fakeDom.js";
import { basicTree, replacedRootTree } from "../fixtures/sampleTrees.js";

test("vNodeToDOM builds DOM nodes with className mapped back to class", () => {
  installDOMGlobals();
  const node = vNodeToDOM(basicTree);

  assert.equal(node.getAttribute("class"), "card");
  assert.equal(
    serializeNode(node),
    '<section class="card" data-kind="article"><h2>Weekly menu</h2><p class="lead">Kimchi stew</p><ul><li>Egg roll</li><li>Seaweed soup</li></ul></section>',
  );
});

test("vNodeToDOM preserves empty text nodes inside elements", () => {
  installDOMGlobals();
  const node = vNodeToDOM(replacedRootTree);

  assert.equal(node.childNodes[0].nodeType, Node.TEXT_NODE);
  assert.equal(node.childNodes[0].nodeValue, "");
});

test("vNodeToDOM ignores event props and returns null for null input", () => {
  installDOMGlobals();
  const node = vNodeToDOM({
    type: "button",
    props: { onClick: "ignored", className: "action" },
    children: [{ type: "TEXT", props: { nodeValue: "Run" }, children: [] }],
  });

  assert.equal(node.getAttribute("class"), "action");
  assert.equal(node.getAttribute("onClick"), null);
  assert.equal(vNodeToDOM(null), null);
});
