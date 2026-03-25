class FakeNode {
  static ELEMENT_NODE = 1;
  static TEXT_NODE = 3;
  static COMMENT_NODE = 8;
  static DOCUMENT_FRAGMENT_NODE = 11;

  constructor(nodeType, ownerDocument = null) {
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.childNodes = [];
  }

  appendChild(node) {
    if (!node) {
      return null;
    }

    detachNode(node);
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }

  insertBefore(node, referenceNode) {
    if (!node) {
      return null;
    }

    if (referenceNode == null) {
      return this.appendChild(node);
    }

    const index = this.childNodes.indexOf(referenceNode);
    if (index === -1) {
      return this.appendChild(node);
    }

    detachNode(node);
    node.parentNode = this;
    this.childNodes.splice(index, 0, node);
    return node;
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index === -1) {
      throw new Error("Cannot remove a node that is not a child.");
    }

    this.childNodes.splice(index, 1);
    node.parentNode = null;
    return node;
  }

  replaceChildren(...nodes) {
    for (const child of [...this.childNodes]) {
      this.removeChild(child);
    }

    for (const node of nodes) {
      if (node != null) {
        this.appendChild(node);
      }
    }
  }

  append(...nodes) {
    for (const node of nodes) {
      if (typeof node === "string") {
        this.appendChild(this.ownerDocument.createTextNode(node));
        continue;
      }

      if (node != null) {
        this.appendChild(node);
      }
    }
  }

  replaceWith(node) {
    if (!this.parentNode) {
      return;
    }

    const parent = this.parentNode;
    const index = parent.childNodes.indexOf(this);
    if (index === -1) {
      return;
    }

    detachNode(node);
    parent.childNodes[index] = node;
    node.parentNode = parent;
    this.parentNode = null;
  }

  get textContent() {
    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this.replaceChildren(this.ownerDocument.createTextNode(String(value ?? "")));
  }
}

class FakeTextNode extends FakeNode {
  constructor(text, ownerDocument) {
    super(FakeNode.TEXT_NODE, ownerDocument);
    this.nodeValue = String(text ?? "");
  }

  get textContent() {
    return this.nodeValue;
  }

  set textContent(value) {
    this.nodeValue = String(value ?? "");
  }
}

class FakeCommentNode extends FakeNode {
  constructor(text, ownerDocument) {
    super(FakeNode.COMMENT_NODE, ownerDocument);
    this.nodeValue = String(text ?? "");
  }

  get textContent() {
    return this.nodeValue;
  }

  set textContent(value) {
    this.nodeValue = String(value ?? "");
  }
}

class FakeElement extends FakeNode {
  constructor(tagName, ownerDocument) {
    super(FakeNode.ELEMENT_NODE, ownerDocument);
    this.tagName = String(tagName).toUpperCase();
    this._attributes = new Map();
    this._listeners = new Map();
    this.value = "";
    this.disabled = false;
  }

  get attributes() {
    return Array.from(this._attributes, ([name, value]) => ({ name, value }));
  }

  setAttribute(name, value) {
    this._attributes.set(String(name), String(value));
  }

  getAttribute(name) {
    return this._attributes.has(String(name)) ? this._attributes.get(String(name)) : null;
  }

  hasAttribute(name) {
    return this._attributes.has(String(name));
  }

  removeAttribute(name) {
    this._attributes.delete(String(name));
  }

  addEventListener(type, listener) {
    const key = String(type);
    if (!this._listeners.has(key)) {
      this._listeners.set(key, []);
    }

    this._listeners.get(key).push(listener);
  }

  dispatchEvent(event) {
    const type = typeof event === "string" ? event : event?.type;
    const listeners = this._listeners.get(String(type)) || [];

    for (const listener of listeners) {
      listener.call(this, event);
    }
  }

  click() {
    this.dispatchEvent({ type: "click", target: this });
  }

  get textContent() {
    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this.replaceChildren(this.ownerDocument.createTextNode(String(value ?? "")));
  }

  get innerHTML() {
    return this.childNodes.map((child) => serializeNode(child)).join("");
  }
}

class FakeDocumentFragment extends FakeNode {
  constructor(ownerDocument) {
    super(FakeNode.DOCUMENT_FRAGMENT_NODE, ownerDocument);
  }
}

class FakeDocument extends FakeNode {
  constructor() {
    super(9, null);
    this.ownerDocument = this;
    this.body = this.createElement("body");
    this.appendChild(this.body);
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createTextNode(text) {
    return new FakeTextNode(text, this);
  }

  createComment(text) {
    return new FakeCommentNode(text, this);
  }

  createDocumentFragment() {
    return new FakeDocumentFragment(this);
  }

  getElementById(id) {
    return findById(this, String(id));
  }
}

function findById(node, id) {
  if (node?.nodeType === FakeNode.ELEMENT_NODE && node.getAttribute("id") === id) {
    return node;
  }

  for (const child of node?.childNodes || []) {
    const found = findById(child, id);
    if (found) {
      return found;
    }
  }

  return null;
}

function detachNode(node) {
  if (!node) {
    return;
  }

  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

export function serializeNode(node) {
  if (!node) {
    return "";
  }

  if (node.nodeType === FakeNode.TEXT_NODE) {
    return escapeHtml(node.nodeValue);
  }

  if (node.nodeType !== FakeNode.ELEMENT_NODE) {
    return "";
  }

  const tagName = node.tagName.toLowerCase();
  const attributes = node.attributes
    .map(({ name, value }) => ` ${name}="${escapeAttribute(value)}"`)
    .join("");
  const children = node.childNodes.map((child) => serializeNode(child)).join("");

  return `<${tagName}${attributes}>${children}</${tagName}>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

export function createTestDocument() {
  return new FakeDocument();
}

export function installDOMGlobals(document = createTestDocument()) {
  globalThis.Node = FakeNode;
  globalThis.document = document;
  return document;
}
