import test from "node:test";
import assert from "node:assert/strict";
import { diff } from "../../src/core/diff.js";

function text(v) {
  return { nodeKind: "TEXT", type: "TEXT", props: { nodeValue: v }, children: [], text: v, key: null };
}

function element(type, props = {}, children = []) {
  return { nodeKind: "ELEMENT", type, props, children, text: null, key: null };
}

test("contract 1: root path used for CREATE", () => {
  const p = diff(null, element("div"));
  assert.deepEqual(p.length, 1);
  assert.equal(p[0].kind, "CREATE");
  assert.deepEqual(p[0].path, []);
});

test("contract 2: root path used for REMOVE", () => {
  const p = diff(element("div"), null);
  assert.deepEqual(p.length, 1);
  assert.equal(p[0].kind, "REMOVE");
  assert.deepEqual(p[0].path, []);
});

test("contract 3: null / empty textValue compare", () => {
  assert.deepEqual(diff(element("p", {}, [text(null)]), element("p", {}, [text("")])), []);
  assert.deepEqual(diff(element("p", {}, [text(undefined)]), element("p", {}, [text("")])), []);
});

test("contract 4: event handlers are ignored", () => {
  const oldNode = element("button", { onClick: "x", class: "a" }, []);
  const newNode = element("button", { onMouseDown: "y", class: "a" }, []);
  assert.deepEqual(diff(oldNode, newNode), []);
});

test("contract 5: nested path correctness", () => {
  const oldNode = element("main", {}, [element("section", {}, [text("A")])]);
  const newNode = element("main", {}, [element("section", {}, [text("B")])]);
  assert.deepEqual(diff(oldNode, newNode), [{ kind: "TEXT", path: [0, 0], text: "B" }]);
});
