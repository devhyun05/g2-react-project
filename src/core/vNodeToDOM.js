import { TEXT_NODE_TYPE } from "./types.js";

function setProps(domNode, props = {}) {
  for (const [name, value] of Object.entries(props)) {
    if (name.startsWith("on")) {
      continue;
    }

    const attributeName = name === "className" ? "class" : name;
    domNode.setAttribute(attributeName, String(value));
  }
}

/**
 * Builds a real DOM node from a VNode.
 *
 * @param {{ type: string, props: Record<string, string>, children: Array } | null} vnode
 * @returns {Node | null}
 */
export function vNodeToDOM(vnode) {
  if (!vnode) {
    return null;
  }

  if (vnode.type === TEXT_NODE_TYPE) {
    return document.createTextNode(vnode.props?.nodeValue ?? "");
  }

  const domNode = document.createElement(vnode.type);
  const props = vnode.props || {};
  const children = Array.isArray(vnode.children) ? vnode.children : [];

  setProps(domNode, props);

  for (const child of children) {
    const childNode = vNodeToDOM(child);

    if (childNode) {
      domNode.appendChild(childNode);
    }
  }

  return domNode;
}
