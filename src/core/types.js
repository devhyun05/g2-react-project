export const TEXT_NODE_TYPE = "TEXT";

export function createVNode(type, props = {}, children = []) {
  return {
    type,
    props: props || {},
    children: Array.isArray(children) ? children : [],
  };
}

export function createTextVNode(nodeValue = "") {
  return createVNode(TEXT_NODE_TYPE, { nodeValue: String(nodeValue) }, []);
}
