export const TEXT_NODE_TYPE = "TEXT";

function normalizeProps(props) {
  return props && typeof props === "object" ? props : {};
}

function normalizeChildren(children) {
  return Array.isArray(children) ? children : [];
}

/**
 * Creates a VNode that follows the team's `{ type, props, children }` contract.
 *
 * @param {string} type
 * @param {Record<string, string>} [props={}]
 * @param {Array} [children=[]]
 * @returns {{ type: string, props: Record<string, string>, children: Array }}
 */
export function createVNode(type, props = {}, children = []) {
  return {
    type,
    props: normalizeProps(props),
    children: normalizeChildren(children),
  };
}

/**
 * Creates a TEXT VNode with the required `props.nodeValue` field.
 *
 * @param {string | number} [nodeValue=""]
 * @returns {{ type: string, props: { nodeValue: string }, children: [] }}
 */
export function createTextVNode(nodeValue = "") {
  return createVNode(TEXT_NODE_TYPE, { nodeValue: String(nodeValue) }, []);
}
