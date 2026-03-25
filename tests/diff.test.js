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

test("diff handles no-change as no patches", () => {
  const node = elementVNode("div", { id: "a" }, [textVNode("x")]);
  const result = diff(node, node);
  assert.deepEqual(result, []);
});

test("diff handles null nodes", () => {
  assert.deepEqual(diff(null, null), []);
  assert.deepEqual(diff(null, elementVNode("div")), [{ kind: "CREATE", path: [], node: elementVNode("div") }]);
  assert.deepEqual(diff(elementVNode("div"), null), [{ kind: "REMOVE", path: [] }]);
});

test("diff text update", () => {
  const oldNode = elementVNode("div", {}, [textVNode("Hello")]);
  const newNode = elementVNode("div", {}, [textVNode("World")]);
  assert.deepEqual(diff(oldNode, newNode), [
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
    patches.sort((a, b) => `${a.kind}:${a.key || ""}`.localeCompare(`${b.kind}:${b.key || ""}`)),
    [
      { kind: "REMOVE_PROP", path: [], key: "hidden" },
      { kind: "SET_PROP", path: [], key: "class", value: "b" },
    ],
  );
});

test("diff children add/remove", () => {
  const oldNode = elementVNode("ul", {}, [textVNode("A")]);
  const newNode = elementVNode("ul", {}, [textVNode("A"), textVNode("B")]);
  assert.deepEqual(diff(oldNode, newNode), [
    {
      kind: "CREATE",
      path: [1],
      node: newNode.children[1],
    },
  ]);

  assert.deepEqual(diff(newNode, oldNode), [
    {
      kind: "REMOVE",
      path: [1],
    },
  ]);
});

test("diff replace node type", () => {
  const oldNode = elementVNode("div");
  const newNode = elementVNode("span");
  assert.deepEqual(diff(oldNode, newNode), [
    {
      kind: "REPLACE",
      path: [],
      node: newNode,
    },
  ]);
});

test("diff text node vs element node", () => {
  const oldNode = textVNode("hello");
  const newNode = elementVNode("p", {}, [textVNode("hello")]);
  assert.deepEqual(diff(oldNode, newNode), [
    {
      kind: "REPLACE",
      path: [],
      node: newNode,
    },
  ]);
});

test("diff deep nested changes", () => {
  const oldNode = elementVNode("div", {}, [
    elementVNode("section", {}, [
      elementVNode("p", {}, [textVNode("A")]),
      elementVNode("ul", {}, [textVNode("1"), textVNode("2")]),
    ]),
  ]);
  const newNode = elementVNode("div", {}, [
    elementVNode("section", {}, [
      elementVNode("p", {}, [textVNode("B")]),
      elementVNode("ul", {}, [textVNode("1"), textVNode("2"), textVNode("3")]),
      elementVNode("footer", { class: "x" }),
    ]),
  ]);
  assert.deepEqual(diff(oldNode, newNode), [
    {
      kind: "TEXT",
      path: [0, 0, 0],
      text: "B",
    },
    {
      kind: "CREATE",
      path: [0, 1, 2],
      node: textVNode("3"),
    },
    {
      kind: "CREATE",
      path: [0, 2],
      node: elementVNode("footer", { class: "x" }),
    },
  ]);
});
