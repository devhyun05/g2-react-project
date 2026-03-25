import test from "node:test";
import assert from "node:assert/strict";
import { diff } from "../src/core/diff.js";

function text(v) {
  return {
    nodeKind: "TEXT",
    type: "TEXT",
    props: { nodeValue: v },
    text: v,
    children: [],
    key: null,
  };
}

function element(type, props = {}, children = []) {
  return {
    nodeKind: "ELEMENT",
    type,
    props,
    children,
    text: null,
    key: null,
  };
}

test("phase1: create/remove root node", () => {
  assert.deepEqual(diff(null, element("div")), [{ kind: "CREATE", path: [], node: element("div") }]);
  assert.deepEqual(diff(element("div"), null), [{ kind: "REMOVE", path: [] }]);
});

test("phase1: replace when node type changes", () => {
  assert.deepEqual(diff(element("div"), element("span")), [
    { kind: "REPLACE", path: [], node: element("span") },
  ]);
});

test("phase1: text change uses props.nodeValue", () => {
  assert.deepEqual(diff(element("p", {}, [text("A")]), element("p", {}, [text("B")]),), [
    { kind: "TEXT", path: [0], text: "B" },
  ]);
});

test("phase1: prop set/remove change", () => {
  const a = element("div", { id: "a" }, []);
  const b = element("div", { class: "x" }, []);
  const result = diff(a, b);
  result.sort((x, y) => x.kind.localeCompare(y.kind));
  assert.deepEqual(result, [
    { kind: "REMOVE_PROP", path: [], key: "id" },
    { kind: "SET_PROP", path: [], key: "class", value: "x" },
  ]);
});

test("phase1: child add/remove by index", () => {
  const oldNode = element("ul", {}, [text("1")]);
  const newNode = element("ul", {}, [text("1"), text("2")]);
  assert.deepEqual(diff(oldNode, newNode), [{ kind: "CREATE", path: [1], node: text("2") }]);

  assert.deepEqual(diff(newNode, oldNode), [{ kind: "REMOVE", path: [1] }]);
});

test("phase1: nested path correctness", () => {
  const oldNode = element("main", {}, [
    element("section", {}, [
      element("p", {}, [text("A")]),
    ]),
  ]);
  const newNode = element("main", {}, [
    element("section", {}, [
      element("p", {}, [text("B")]),
      element("p", {}, []),
    ]),
  ]);

  assert.deepEqual(diff(oldNode, newNode), [
    { kind: "TEXT", path: [0, 0, 0], text: "B" },
    { kind: "CREATE", path: [0, 1], node: element("p", {}, []) },
  ]);
});

