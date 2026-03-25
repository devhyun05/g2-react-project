export const TEXT_NODE_TYPE = "TEXT";
export const NODE_KIND = {
  ELEMENT: "ELEMENT",
  TEXT: TEXT_NODE_TYPE,
};

function normalizeProps(props) {
  return props && typeof props === "object" ? { ...props } : {};
}

function normalizeChildren(children) {
  return Array.isArray(children) ? children : [];
}

export function createVNode(type, props = {}, children = []) {
  const nextProps = normalizeProps(props);
  const nextChildren = normalizeChildren(children);
  const keyFromProps = nextProps.key;

  if (typeof keyFromProps !== "undefined") {
    delete nextProps.key;
  }

  const vnode = {
    type,
    props: nextProps,
    children: nextChildren,
  };

  if (keyFromProps != null) {
    vnode.key = String(keyFromProps);
  }

  return vnode;
}

export function createTextVNode(nodeValue = "") {
  return createVNode(TEXT_NODE_TYPE, { nodeValue: String(nodeValue) }, []);
}
