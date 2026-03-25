import test from "node:test";
import assert from "node:assert/strict";
import { diff } from "../src/core/diff.js";
import { NODE_KIND } from "../src/core/types.js";

function textVNode(value) {
  return {
    nodeKind: NODE_KIND.TEXT,
    type: "#text",
    props: {},
    children: [],
    text: value,
    key: null,
  };
}

function elementVNode(type, props = {}, children = []) {
  return {
    nodeKind: NODE_KIND.ELEMENT,
    type,
    props,
    children,
    text: null,
    key: null,
  };
}

test("diff text update", () => {
  const oldNode = elementVNode("div", {}, [textVNode("Hello")]);
  const newNode = elementVNode("div", {}, [textVNode("World")]);
  const patches = diff(oldNode, newNode);
  assert.deepEqual(patches, [
    {
      kind: "TEXT",
      path: [0],
      text: "World",
    },
  ]);
});

test("diff set/remove prop", () => {
  const oldNode = elementVNode("div", { class: "a", hidden: "true" });
  const newNode = elementVNode("div", { class: "b" });
  const patches = diff(oldNode, newNode);
  assert.deepEqual(
    patches.sort((a, b) => a.kind.localeCompare(b.kind)),
    [
      { kind: "REMOVE_PROP", path: [], key: "hidden" },
      { kind: "SET_PROP", path: [], key: "class", value: "b" },
    ].sort((a, b) => a.kind.localeCompare(b.kind)),
  );
});

test("diff children add/remove", () => {
  const oldNode = elementVNode("ul", {}, [textVNode("A")]);
  const newNode = elementVNode("ul", {}, [textVNode("A"), textVNode("B")]);
  const create = diff(oldNode, newNode);
  assert.deepEqual(create, [
    {
      kind: "CREATE",
      path: [1],
      node: newNode.children[1],
    },
  ]);

  const remove = diff(newNode, oldNode);
  assert.deepEqual(remove, [
    {
      kind: "REMOVE",
      path: [1],
    },
  ]);
});

test("diff replace node type", () => {
  const oldNode = elementVNode("div");
  const newNode = elementVNode("span");
  const patches = diff(oldNode, newNode);
  assert.deepEqual(patches, [
    {
      kind: "REPLACE",
      path: [],
      node: newNode,
    },
  ]);
});
