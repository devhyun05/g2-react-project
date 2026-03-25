import test from "node:test";
import assert from "node:assert/strict";

import { domToVNode } from "../../src/core/domToVNode.js";
import {
  createCommentNode,
  createElement,
  createTextNode,
  installFakeDom,
} from "../helpers/fakeDom.js";

installFakeDom();

test("domToVNode converts class to className and ignores comment and event attributes", () => {
  const domTree = createElement("div", { class: "card", id: "root", onclick: "noop()" }, [
    createCommentNode("skip me"),
    createTextNode("hello"),
  ]);

  assert.deepEqual(domToVNode(domTree), {
    type: "div",
    props: {
      className: "card",
      id: "root",
    },
    children: [
      {
        type: "TEXT",
        props: { nodeValue: "hello" },
        children: [],
      },
    ],
  });
});

test("domToVNode preserves nested mixed content including empty text nodes", () => {
  const domTree = createElement("section", {}, [
    createTextNode(""),
    createElement("span", { class: "label" }, [createTextNode("count")]),
    createTextNode(" "),
  ]);

  assert.deepEqual(domToVNode(domTree), {
    type: "section",
    props: {},
    children: [
      {
        type: "TEXT",
        props: { nodeValue: "" },
        children: [],
      },
      {
        type: "span",
        props: { className: "label" },
        children: [
          {
            type: "TEXT",
            props: { nodeValue: "count" },
            children: [],
          },
        ],
      },
      {
        type: "TEXT",
        props: { nodeValue: " " },
        children: [],
      },
    ],
  });
});
