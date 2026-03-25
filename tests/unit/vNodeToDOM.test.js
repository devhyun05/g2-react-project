import test from "node:test";
import assert from "node:assert/strict";

import { vNodeToDOM } from "../../src/core/vNodeToDOM.js";
import { installFakeDom } from "../helpers/fakeDom.js";

installFakeDom();

test("vNodeToDOM converts className back to class and ignores event props", () => {
  const domNode = vNodeToDOM({
    type: "button",
    props: {
      className: "primary",
      id: "save-button",
      onClick: "ignored",
    },
    children: [
      {
        type: "TEXT",
        props: { nodeValue: "Save" },
        children: [],
      },
    ],
  });

  assert.equal(domNode.tagName, "BUTTON");
  assert.equal(domNode.getAttribute("class"), "primary");
  assert.equal(domNode.getAttribute("id"), "save-button");
  assert.equal(domNode.getAttribute("onClick"), null);
  assert.equal(domNode.childNodes[0].nodeValue, "Save");
});

test("vNodeToDOM creates text nodes from props.nodeValue", () => {
  const textNode = vNodeToDOM({
    type: "TEXT",
    props: { nodeValue: "0" },
    children: [],
  });

  assert.equal(textNode.nodeType, Node.TEXT_NODE);
  assert.equal(textNode.nodeValue, "0");
});
