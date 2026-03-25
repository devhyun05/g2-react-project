import test from "node:test";
import assert from "node:assert/strict";
import { diff } from "../../src/core/diff.js";

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

test("contract: root create/remove", () => {
  assert.deepEqual(diff(null, element("div")), [{ kind: "CREATE", path: [], node: element("div") }]);
  assert.deepEqual(diff(element("div"), null), [{ kind: "REMOVE", path: [] }]);
});

test("contract: replace when node type changes", () => {
  assert.deepEqual(diff(element("div"), element("span")), [
    { kind: "REPLACE", path: [], node: element("span") },
  ]);
});

test("contract: text nodeValue diff", () => {
  assert.deepEqual(diff(element("p", {}, [text("A")]), element("p", {}, [text("B")]),), [
    { kind: "TEXT", path: [0], text: "B" },
  ]);
});

test("contract: prop set and remove", () => {
  const oldNode = element("div", { id: "a" }, []);
  const newNode = element("div", { class: "x" }, []);
  const result = diff(oldNode, newNode);
  result.sort((x, y) => x.kind.localeCompare(y.kind));
  assert.deepEqual(result, [
    { kind: "REMOVE_PROP", path: [], key: "id" },
    { kind: "SET_PROP", path: [], key: "class", value: "x" },
  ]);
});

test("contract: children add/remove by index", () => {
  assert.deepEqual(diff(element("ul", {}, [text("1")]), element("ul", {}, [text("1"), text("2")])), [
    { kind: "CREATE", path: [1], node: text("2") },
  ]);

  assert.deepEqual(diff(element("ul", {}, [text("1"), text("2")]), element("ul", {}, [text("1")])), [
    { kind: "REMOVE", path: [1] },
  ]);
});

test("contract: nested path correctness", () => {
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
