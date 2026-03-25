import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import { render } from "../../src/core/render.js";
import { installDOMGlobals, serializeNode } from "../helpers/fakeDom.js";
import { basicTree, updatedTree } from "../fixtures/sampleTrees.js";

test("render clears the container and mounts a fresh tree", () => {
  const document = installDOMGlobals();
  const container = document.createElement("div");
  container.appendChild(document.createTextNode("stale"));

  const node = render(basicTree, container);

  assert.equal(container.childNodes.length, 1);
  assert.equal(container.childNodes[0], node);
});

test("render can replace an existing tree with a structurally different tree", () => {
  const document = installDOMGlobals();
  const container = document.createElement("div");

  render(basicTree, container);
  render(updatedTree, container);

  assert.equal(
    serializeNode(container.childNodes[0]),
    '<section class="card featured" data-kind="article"><h2>Weekly menu</h2><p class="lead">Soybean paste stew</p><ul><li>Egg roll</li><li>Seaweed soup</li><li>Seasonal fruit</li></ul></section>',
  );
});

test("render clears the container when vnode is null", () => {
  const document = installDOMGlobals();
  const container = document.createElement("div");
  render(basicTree, container);

  const node = render(null, container);

  assert.equal(node, null);
  assert.equal(container.childNodes.length, 0);
});
