export const TEXT_NODE_TYPE = "TEXT";
export const NODE_KIND = {
  ELEMENT: "ELEMENT",
  TEXT: TEXT_NODE_TYPE,
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
