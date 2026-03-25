import assert from "node:assert/strict";
import { applyPatches, getDOMNodeByPath } from "../../src/core/patch.js";
import { test } from "../helpers/testHarness.js";

class FakeNode {
  constructor(nodeType) {
    this.nodeType = nodeType;
    this.parentNode = null;
    this.childNodes = [];
  }

  get nextSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    const index = siblings.indexOf(this);
    if (index < 0 || index + 1 >= siblings.length) return null;
    return siblings[index + 1];
  }

  replaceWith(nextNode) {
    if (!this.parentNode) return;
    const parent = this.parentNode;
    const index = parent.childNodes.indexOf(this);
    if (index < 0) return;

    if (nextNode.parentNode) {
      nextNode.parentNode.removeChild(nextNode);
    }

    nextNode.parentNode = parent;
    parent.childNodes[index] = nextNode;
    this.parentNode = null;
  }
}

class FakeTextNode extends FakeNode {
  constructor(value = "") {
    super(3);
    this.nodeValue = String(value);
  }

  get textContent() {
    return this.nodeValue;
  }

  set textContent(nextValue) {
    this.nodeValue = String(nextValue ?? "");
  }
}

class FakeElementNode extends FakeNode {
  constructor(tagName) {
    super(1);
    this.tagName = String(tagName).toLowerCase();
    this.attributes = {};
  }

  appendChild(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }

  insertBefore(node, referenceNode) {
    if (!referenceNode) return this.appendChild(node);

    const index = this.childNodes.indexOf(referenceNode);
    if (index < 0) return this.appendChild(node);

    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    node.parentNode = this;
    this.childNodes.splice(index, 0, node);
    return node;
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index < 0) return null;
    this.childNodes.splice(index, 1);
    node.parentNode = null;
    return node;
  }

  setAttribute(key, value) {
    this.attributes[key] = String(value);
  }

  removeAttribute(key) {
    delete this.attributes[key];
  }

  getAttribute(key) {
    if (!Object.prototype.hasOwnProperty.call(this.attributes, key)) return null;
    return this.attributes[key];
  }

  get textContent() {
    return this.childNodes.map((node) => node.textContent ?? "").join("");
  }

  set textContent(nextValue) {
    this.childNodes = [];
    this.appendChild(new FakeTextNode(String(nextValue ?? "")));
  }
}

function createFakeDocument() {
  return {
    createElement: (tagName) => new FakeElementNode(tagName),
    createTextNode: (value) => new FakeTextNode(value),
  };
}

function textVNode(nodeValue = "") {
  return {
    type: "TEXT",
    props: { nodeValue: String(nodeValue) },
    children: [],
  };
}

function elementVNode(type, props = {}, children = []) {
  return { type, props, children };
}

function buildDOMFromVNode(vnode) {
  if (vnode.type === "TEXT") {
    return document.createTextNode(vnode.props?.nodeValue ?? "");
  }

  const element = document.createElement(vnode.type);
  const props = vnode.props && typeof vnode.props === "object" ? vnode.props : {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "nodeValue") continue;
    if (typeof value === "undefined" || value === null) continue;
    element.setAttribute(key === "className" ? "class" : key, String(value));
  }

  const children = Array.isArray(vnode.children) ? vnode.children : [];
  for (const child of children) {
    element.appendChild(buildDOMFromVNode(child));
  }

  return element;
}

function withFakeDocument(fn) {
  const originalDocument = globalThis.document;
  globalThis.document = createFakeDocument();

  try {
    return fn();
  } finally {
    if (typeof originalDocument === "undefined") {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  }
}

test("getDOMNodeByPath는 rootEl 기준으로 path를 탐색한다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(
      elementVNode("div", {}, [
        elementVNode("p", {}, [textVNode("A")]),
        elementVNode("span", {}, [textVNode("B")]),
      ]),
    );

    assert.equal(getDOMNodeByPath(root, []), root);
    assert.equal(getDOMNodeByPath(root, [0]).tagName, "p");
    assert.equal(getDOMNodeByPath(root, [0, 0]).nodeValue, "A");
    assert.equal(getDOMNodeByPath(root, [9]), null);
  }));

test("TEXT patch는 text node의 nodeValue를 갱신한다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(
      elementVNode("div", {}, [elementVNode("p", {}, [textVNode("before")])]),
    );

    applyPatches(root, [{ kind: "TEXT", path: [0, 0], text: "after" }]);

    assert.equal(getDOMNodeByPath(root, [0, 0]).nodeValue, "after");
  }));

test("SET_PROP/REMOVE_PROP은 className 매핑을 지키고 이벤트 prop은 무시한다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(elementVNode("div", {}, [elementVNode("p")]));
    const target = getDOMNodeByPath(root, [0]);

    applyPatches(root, [
      { kind: "SET_PROP", path: [0], key: "className", value: "hero" },
      { kind: "SET_PROP", path: [0], key: "onClick", value: "noop" },
    ]);

    assert.equal(target.getAttribute("class"), "hero");
    assert.equal(target.getAttribute("className"), null);
    assert.equal(target.getAttribute("onClick"), null);

    applyPatches(root, [{ kind: "REMOVE_PROP", path: [0], key: "className" }]);
    assert.equal(target.getAttribute("class"), null);
  }));

test("CREATE와 REMOVE patch는 index path 기준으로 자식을 추가/삭제한다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(
      elementVNode("ul", {}, [elementVNode("li", {}, [textVNode("A")])]),
    );

    applyPatches(root, [
      {
        kind: "CREATE",
        path: [1],
        node: elementVNode("li", {}, [textVNode("B")]),
      },
    ]);

    assert.equal(root.childNodes.length, 2);
    assert.equal(getDOMNodeByPath(root, [1, 0]).nodeValue, "B");

    applyPatches(root, [{ kind: "REMOVE", path: [0] }]);
    assert.equal(root.childNodes.length, 1);
    assert.equal(getDOMNodeByPath(root, [0, 0]).nodeValue, "B");
  }));

test("REPLACE patch는 대상 노드를 새 VNode 기반 DOM으로 교체한다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(
      elementVNode("div", {}, [elementVNode("p", { id: "old" }, [textVNode("A")])]),
    );

    applyPatches(root, [
      {
        kind: "REPLACE",
        path: [0],
        node: elementVNode("section", { id: "new" }, [textVNode("B")]),
      },
    ]);

    assert.equal(getDOMNodeByPath(root, [0]).tagName, "section");
    assert.equal(getDOMNodeByPath(root, [0]).getAttribute("id"), "new");
    assert.equal(getDOMNodeByPath(root, [0, 0]).nodeValue, "B");
  }));

test("중첩 path에서도 CREATE patch가 올바른 부모에 삽입된다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(
      elementVNode("main", {}, [
        elementVNode("section", {}, [elementVNode("p", {}, [textVNode("A")])]),
      ]),
    );

    applyPatches(root, [
      {
        kind: "CREATE",
        path: [0, 1],
        node: elementVNode("p", {}, [textVNode("B")]),
      },
    ]);

    assert.equal(getDOMNodeByPath(root, [0, 1]).tagName, "p");
    assert.equal(getDOMNodeByPath(root, [0, 1, 0]).nodeValue, "B");
  }));

test("getDOMNodeByPath는 잘못된 path 입력에서 null을 반환한다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(elementVNode("div", {}, [elementVNode("p")]));

    assert.equal(getDOMNodeByPath(root, null), null);
    assert.equal(getDOMNodeByPath(root, "0"), null);
    assert.equal(getDOMNodeByPath(root, [-1]), null);
    assert.equal(getDOMNodeByPath(root, [0, 1.5]), null);
  }));

test("TEXT patch가 element를 가리키면 textContent로 대체된다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(
      elementVNode("div", {}, [elementVNode("p", {}, [textVNode("A"), textVNode("B")])]),
    );

    applyPatches(root, [{ kind: "TEXT", path: [0], text: "Replaced" }]);

    const target = getDOMNodeByPath(root, [0]);
    assert.equal(target.textContent, "Replaced");
    assert.equal(target.childNodes.length, 1);
    assert.equal(target.childNodes[0].nodeType, 3);
  }));

test("CREATE path=[]는 rootEl의 첫 자식 위치에 삽입된다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(
      elementVNode("div", {}, [
        elementVNode("p", { id: "first" }, [textVNode("A")]),
        elementVNode("p", { id: "second" }, [textVNode("B")]),
      ]),
    );

    applyPatches(root, [
      {
        kind: "CREATE",
        path: [],
        node: elementVNode("p", { id: "new-root-child" }, [textVNode("N")]),
      },
    ]);

    assert.equal(root.childNodes.length, 3);
    assert.equal(getDOMNodeByPath(root, [0]).getAttribute("id"), "new-root-child");
    assert.equal(getDOMNodeByPath(root, [1]).getAttribute("id"), "first");
  }));

test("잘못된 patch 입력은 무시되고 DOM이 깨지지 않는다", () =>
  withFakeDocument(() => {
    const root = buildDOMFromVNode(
      elementVNode("div", {}, [elementVNode("p", { id: "safe" }, [textVNode("A")])]),
    );
    const before = root.childNodes.length;

    assert.doesNotThrow(() => {
      applyPatches(root, [
        null,
        {},
        { kind: "UNKNOWN", path: [] },
        { kind: "SET_PROP", path: [0], key: "id", value: null },
        { kind: "REMOVE_PROP", path: [0], key: 123 },
        { kind: "CREATE", path: [0], node: null },
        { kind: "TEXT", path: "invalid", text: "X" },
      ]);
    });

    assert.equal(root.childNodes.length, before);
    assert.equal(getDOMNodeByPath(root, [0]).getAttribute("id"), "safe");
    assert.equal(getDOMNodeByPath(root, [0, 0]).nodeValue, "A");
  }));
