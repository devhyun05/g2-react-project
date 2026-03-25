import { vNodeToDOM } from "./vNodeToDOM.js";

/**
 * Clears a container and mounts a fresh DOM tree from the given VNode.
 *
 * @param {{ type: string, props: Record<string, string>, children: Array } | null} vnode
 * @param {Element} container
 * @returns {Node | null}
 */
export function render(vnode, container) {
  const domNode = vNodeToDOM(vnode);

  container.replaceChildren();

  if (domNode) {
    container.appendChild(domNode);
  }

  return domNode;
}
