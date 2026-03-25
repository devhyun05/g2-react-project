import test from "node:test";
import assert from "node:assert/strict";
import { diff } from "../src/core/diff.js";

function text(v) {
  return { nodeKind: "TEXT", type: "TEXT", props: { nodeValue: v }, text: v, children: [] };
}

function element(type, props = {}, children = []) {
  return { nodeKind: "ELEMENT", type, props, children, text: null, key: null };
}

function keyed(type, key, props = {}, children = []) {
  return { nodeKind: "ELEMENT", type, props, children, text: null, key };
}

test("phase3: create/remove root node", () => {
  assert.deepEqual(diff(null, element("div")), [{ kind: "CREATE", path: [], node: element("div") }]);
  assert.deepEqual(diff(element("div"), null), [{ kind: "REMOVE", path: [] }]);
});

test("phase3: replace node type", () => {
  assert.deepEqual(diff(element("div"), element("span")), [
    { kind: "REPLACE", path: [], node: element("span") },
  ]);
});

test("phase3: text change + nested index path", () => {
  assert.deepEqual(diff(element("p", {}, [text("A")]), element("p", {}, [text("B")])), [
    { kind: "TEXT", path: [0], text: "B" },
  ]);
});

test("phase3: props set/remove", () => {
  const oldNode = element("div", { id: "a", hidden: "true" }, []);
  const newNode = element("div", { id: "a", class: "x" }, []);
  assert.deepEqual(
    diff(oldNode, newNode),
    [
      { kind: "REMOVE_PROP", path: [], key: "hidden" },
      { kind: "SET_PROP", path: [], key: "class", value: "x" },
    ],
  );
});

test("phase3: children add/remove by index", () => {
  assert.deepEqual(
    diff(element("ul", {}, [text("1")]), element("ul", {}, [text("1"), text("2")])) ,
    [{ kind: "CREATE", path: [1], node: text("2") }],
  );
  assert.deepEqual(
    diff(element("ul", {}, [text("1"), text("2")]), element("ul", {}, [text("1")])) ,
    [{ kind: "REMOVE", path: [1] }],
  );
});

test("phase3: keyed children uses index optimization", () => {
  const oldNode = element("ul", {}, [
    keyed("li", "a", {}, [text("A")]),
    keyed("li", "b", {}, [text("B")]),
    keyed("li", "c", {}, [text("C")]),
  ]);
  const newNode = element("ul", {}, [
    keyed("li", "b", {}, [text("B")]),
    keyed("li", "a", {}, [text("A")]),
    keyed("li", "c", {}, [text("C")]),
  ]);
  const result = diff(oldNode, newNode);

  const kinds = result.map((patch) => patch.kind).sort();
  assert.deepEqual(new Set(kinds), new Set(["CREATE", "REMOVE"]));
  assert.equal(result.length >= 2, true);
});

test("phase3: null/undefined nodeValue is treated as empty string", () => {
  const oldNode = element("p", {}, [text(null)]);
  const newNode = element("p", {}, [text("")]);
  assert.deepEqual(diff(oldNode, newNode), []);
});
