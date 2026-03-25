import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import { getDOMNodeByPath, applyPatches } from "../../src/core/patch.js";
import { installDOMGlobals, serializeNode } from "../helpers/fakeDom.js";
import { basicTree, updatedTree } from "../fixtures/sampleTrees.js";
import { diff } from "../../src/core/diff.js";
import { vNodeToDOM } from "../../src/core/vNodeToDOM.js";

test("patch contract resolves nodes by path from the provided root element", () => {
  installDOMGlobals();
  const root = vNodeToDOM(basicTree);
  const target = getDOMNodeByPath(root, [2, 1, 0]);

  assert.equal(target.nodeType, Node.TEXT_NODE);
  assert.equal(target.nodeValue, "Seaweed soup");
});

test("applyPatches mutates only through documented patch operations", () => {
  installDOMGlobals();
  const root = vNodeToDOM(basicTree);
  const patches = diff(basicTree, updatedTree);

  applyPatches(root, patches);

  assert.equal(
    serializeNode(root),
    '<section class="card featured" data-kind="article"><h2>Weekly menu</h2><p class="lead">Soybean paste stew</p><ul><li>Egg roll</li><li>Seaweed soup</li><li>Seasonal fruit</li></ul></section>',
  );
});
