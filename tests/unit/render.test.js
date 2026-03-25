import test from "node:test";
import assert from "node:assert/strict";

import { render } from "../../src/core/render.js";
import {
  createElement,
  createTextNode,
  installFakeDom,
} from "../helpers/fakeDom.js";

installFakeDom();

test("render clears existing children before mounting the next tree", () => {
  const container = createElement("div", {}, [createTextNode("stale")]);

  const mountedNode = render(
    {
      type: "main",
      props: { className: "screen" },
      children: [
        {
          type: "TEXT",
          props: { nodeValue: "fresh" },
          children: [],
        },
      ],
    },
    container
  );

  assert.equal(container.childNodes.length, 1);
  assert.equal(container.childNodes[0], mountedNode);
  assert.equal(container.childNodes[0].tagName, "MAIN");
  assert.equal(container.childNodes[0].childNodes[0].nodeValue, "fresh");
});

test("render returns null and empties the container when vnode is null", () => {
  const container = createElement("div", {}, [createTextNode("old")]);

  const mountedNode = render(null, container);

  assert.equal(mountedNode, null);
  assert.equal(container.childNodes.length, 0);
});
