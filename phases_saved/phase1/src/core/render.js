import { vNodeToDOM } from "./vNodeToDOM.js";

export function render(vnode, container) {
  if (!container) return null;
  container.textContent = "";
  if (!vnode) return null;
  const domNode = vNodeToDOM(vnode);
  if (domNode) container.appendChild(domNode);
  return container.firstChild;
}

