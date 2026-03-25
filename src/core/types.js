<<<<<<< HEAD
export const NODE_KIND = {
  ELEMENT: "ELEMENT",
  TEXT: "TEXT",
};
=======
export const NODE_KIND = {
  ELEMENT: "ELEMENT",
  TEXT: "TEXT",
};

export const TEXT_NODE_TYPE = "TEXT";
export const NODE_KIND = {
  ELEMENT: "ELEMENT",
  TEXT: "TEXT",
};

function normalizeProps(props) {
  return props && typeof props === "object" ? props : {};
}

function normalizeChildren(children) {
  return Array.isArray(children) ? children : [];
}

export function createVNode(type, props = {}, children = []) {
  return {
    type,
    props: normalizeProps(props),
    children: normalizeChildren(children),
  };
}

export function createTextVNode(nodeValue = "") {
  return createVNode(TEXT_NODE_TYPE, { nodeValue: String(nodeValue) }, []);
}
>>>>>>> 550e3a751aa6171421e2d0fb29dc0d520583f7ee
