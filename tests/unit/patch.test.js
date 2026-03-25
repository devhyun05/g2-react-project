import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import { applyPatches, getDOMNodeByPath } from "../../src/core/patch.js";
import { installDOMGlobals, serializeNode } from "../helpers/fakeDom.js";
import { basicTree, deepTree, replacedRootTree, updatedTree } from "../fixtures/sampleTrees.js";
import { diff } from "../../src/core/diff.js";
import { vNodeToDOM } from "../../src/core/vNodeToDOM.js";

test("applyPatches applies diff output to produce the target DOM", () => {
  installDOMGlobals();
  const root = vNodeToDOM(basicTree);

  applyPatches(root, diff(basicTree, updatedTree));

  assert.equal(
    serializeNode(root),
    '<section class="card featured" data-kind="article"><h2>Weekly menu</h2><p class="lead">Soybean paste stew</p><ul><li>Egg roll</li><li>Seaweed soup</li><li>Seasonal fruit</li></ul></section>',
  );
});

test("applyPatches safely ignores invalid paths and unsupported payloads", () => {
  installDOMGlobals();
  const root = vNodeToDOM(basicTree);
  const before = serializeNode(root);

  applyPatches(root, [
    { kind: "TEXT", path: [9, 9], text: "ignored" },
    { kind: "SET_PROP", path: [1, 0], key: "className", value: "bad-target" },
    { kind: "REMOVE", path: "not-an-array" },
    { kind: "CREATE", path: [2, 9], node: null },
  ]);

  assert.equal(serializeNode(root), before);
});

test("getDOMNodeByPath resolves extreme deep descendants", () => {
  installDOMGlobals();
  const root = vNodeToDOM(deepTree);

  const target = getDOMNodeByPath(root, [0, 0, 0, 0]);

  assert.equal(target.nodeType, Node.TEXT_NODE);
  assert.equal(target.nodeValue, "deep value");
});

test("applyPatches can replace the root element when called on the mounted root", () => {
  installDOMGlobals();
  const container = document.createElement("div");
  const root = vNodeToDOM(basicTree);
  container.appendChild(root);

  applyPatches(root, [{ kind: "REPLACE", path: [], node: replacedRootTree }]);

  assert.equal(
    serializeNode(container.childNodes[0]),
    '<article class="notice"><strong>Emergency notice</strong></article>',
  );
});

test("applyPatches can insert at a specific child index and remove className-mapped props", () => {
  installDOMGlobals();
  const root = vNodeToDOM({
    type: "ul",
    props: { className: "menu" },
    children: [
      { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "first" }, children: [] }] },
      { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "third" }, children: [] }] },
    ],
  });

  applyPatches(root, [
    {
      kind: "CREATE",
      path: [1],
      node: { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "second" }, children: [] }] },
    },
    { kind: "REMOVE_PROP", path: [], key: "className" },
  ]);

  assert.equal(
    serializeNode(root),
    "<ul><li>first</li><li>second</li><li>third</li></ul>",
  );
});
