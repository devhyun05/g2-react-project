import test from "node:test";
import assert from "node:assert/strict";
import { diff } from "../../src/core/diff.js";

function text(v) {
  return { type: "TEXT", props: { nodeValue: v }, children: [] };
}

function element(type, props = {}, children = []) {
  return { type, props, children };
}

function getPatchKinds(patches) {
  return patches.map((p) => p.kind).sort();
}

test("unit: both nodes missing returns empty", () => {
  assert.deepEqual(diff(null, null), []);
});

test("unit: identical text node returns empty", () => {
  assert.deepEqual(diff(text("same"), text("same")), []);
});

test("unit: create when old node is missing", () => {
  assert.deepEqual(diff(null, text("new")), [{ kind: "CREATE", path: [], node: text("new") }]);
});

test("unit: remove when new node is missing", () => {
  assert.deepEqual(diff(text("old"), null), [{ kind: "REMOVE", path: [] }]);
});

test("unit: replace when type changes", () => {
  assert.deepEqual(diff(element("div"), element("span")), [{ kind: "REPLACE", path: [], node: element("span") }]);
});

test("unit: text value changed emits TEXT patch", () => {
  assert.deepEqual(diff(text("A"), text("B")), [{ kind: "TEXT", path: [], text: "B" }]);
});

test("unit: prop set, modify, remove", () => {
  const oldNode = element("div", { id: "old", className: "base" }, []);
  const newNode = element("div", { id: "new", role: "button" }, []);
  const result = diff(oldNode, newNode);

  assert.deepEqual(result, [
    { kind: "REMOVE_PROP", path: [], key: "className" },
    { kind: "SET_PROP", path: [], key: "id", value: "new" },
    { kind: "SET_PROP", path: [], key: "role", value: "button" },
  ]);
});

test("unit: ignore event handler props", () => {
  const oldNode = element("button", { onClick: "old", className: "a" }, []);
  const newNode = element("button", { onClick: "new", className: "a" }, []);
  assert.deepEqual(diff(oldNode, newNode), []);
});

test("unit: add child at deeper path", () => {
  const oldNode = element("ul", {}, [element("li", {}, [text("1")])]);
  const newNode = element("ul", {}, [element("li", {}, [text("1")]), element("li", {}, [text("2")])]);
  assert.deepEqual(diff(oldNode, newNode), [{ kind: "CREATE", path: [1], node: element("li", {}, [text("2")]) }]);
});

test("unit: remove child at deeper path", () => {
  const oldNode = element("ul", {}, [element("li", {}, [text("1")]), element("li", {}, [text("2")])]);
  const newNode = element("ul", {}, [element("li", {}, [text("1")])]);
  assert.deepEqual(diff(oldNode, newNode), [{ kind: "REMOVE", path: [1] }]);
});

test("unit: nested text path correctness", () => {
  const oldNode = element("div", {}, [
    element("header", {}, [text("A")]),
    element("main", {}, [text("B")]),
  ]);
  const newNode = element("div", {}, [
    element("header", {}, [text("A")]),
    element("main", {}, [text("C")]),
  ]);
  assert.deepEqual(diff(oldNode, newNode), [{ kind: "TEXT", path: [1, 0], text: "C" }]);
});


test("unit: get patch kinds for complex update", () => {
  const oldNode = element("section", { id: "a" }, [
    element("p", { className: "x" }, [text("old")]),
  ]);
  const newNode = element("section", { id: "a", role: "doc" }, [
    element("p", { className: "y" }, [text("new")]),
    element("span", {}, []),
  ]);

  const result = diff(oldNode, newNode);

  assert.deepEqual(getPatchKinds(result), ["CREATE", "CREATE", "SET_PROP", "SET_PROP", "TEXT"]);
});
