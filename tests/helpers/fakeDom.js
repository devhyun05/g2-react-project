class FakeNodeBase {
  constructor(nodeType) {
    this.nodeType = nodeType;
    this.parentNode = null;
  }
}

class FakeTextNode extends FakeNodeBase {
  constructor(nodeValue = "") {
    super(globalThis.Node.TEXT_NODE);
    this.nodeValue = String(nodeValue);
    this.childNodes = [];
  }
}

class FakeCommentNode extends FakeNodeBase {
  constructor(nodeValue = "") {
    super(globalThis.Node.COMMENT_NODE);
    this.nodeValue = String(nodeValue);
    this.childNodes = [];
  }
}

class FakeElement extends FakeNodeBase {
  constructor(tagName) {
    super(globalThis.Node.ELEMENT_NODE);
    this.tagName = String(tagName).toUpperCase();
    this.childNodes = [];
    this._attributes = new Map();
  }

  get attributes() {
    return Array.from(this._attributes.entries(), ([name, value]) => ({
      name,
      value,
    }));
  }

  appendChild(childNode) {
    childNode.parentNode = this;
    this.childNodes.push(childNode);
    return childNode;
  }

  replaceChildren(...newChildren) {
    this.childNodes = [];

    for (const child of newChildren) {
      this.appendChild(child);
    }
  }

  setAttribute(name, value) {
    this._attributes.set(String(name), String(value));
  }

  getAttribute(name) {
    return this._attributes.has(name) ? this._attributes.get(name) : null;
  }
}

function createDocument() {
  return {
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    createTextNode(nodeValue) {
      return new FakeTextNode(nodeValue);
    },
  };
}

export function installFakeDom() {
  globalThis.Node = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
    COMMENT_NODE: 8,
  };

  globalThis.document = createDocument();
}

export function createElement(tagName, props = {}, children = []) {
  const element = document.createElement(tagName);

  for (const [name, value] of Object.entries(props)) {
    element.setAttribute(name, value);
  }

  for (const child of children) {
    element.appendChild(child);
  }

  return element;
}

export function createTextNode(nodeValue) {
  return document.createTextNode(nodeValue);
}

export function createCommentNode(nodeValue) {
  return new FakeCommentNode(nodeValue);
}
