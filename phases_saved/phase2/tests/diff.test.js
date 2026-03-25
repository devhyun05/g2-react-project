import test from "node:test";
import assert from "node:assert/strict";
import { diff } from "../src/core/diff.js";

function text(v) {
  return { nodeKind: "TEXT", type: "TEXT", props: { nodeValue: v }, children: [], text: v, key: null };
}

function element(type, props = {}, children = []) {
  return { nodeKind: "ELEMENT", type, props, children, text: null, key: null };
}

test("phase2: create/remove root node", () => {
  assert.deepEqual(diff(null, element("div")), [{ kind: "CREATE", path: [], node: element("div") }]);
  assert.deepEqual(diff(element("div"), null), [{ kind: "REMOVE", path: [] }]);
});

test("phase2: replace when node type changes", () => {
  assert.deepEqual(diff(element("div"), element("span")), [
    { kind: "REPLACE", path: [], node: element("span") },
  ]);
});

test("phase2: text nodeValue compare", () => {
  assert.deepEqual(diff(element("p", {}, [text("A")]), element("p", {}, [text("B")])), [
    { kind: "TEXT", path: [0], text: "B" },
  ]);
});

test("phase2: child add/remove by index", () => {
  const oldNode = element("ul", {}, [text("1")]);
  const newNode = element("ul", {}, [text("1"), text("2")]);
  assert.deepEqual(diff(oldNode, newNode), [{ kind: "CREATE", path: [1], node: text("2") }]);
  assert.deepEqual(diff(newNode, oldNode), [{ kind: "REMOVE", path: [1] }]);
});

test("phase2: prop change and ignore event handlers", () => {
  const oldNode = element("button", { class: "a", onClick: "A" }, []);
  const newNode = element("button", { class: "b", onMouseDown: "B" }, []);
  assert.deepEqual(
    diff(oldNode, newNode),
    [{ kind: "SET_PROP", path: [], key: "class", value: "b" }],
  );
});
