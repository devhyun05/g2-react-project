import { vNodeToDOM } from "./vNodeToDOM.js";

export function render(vnode, container) {
  container.innerHTML = "";

  const domNode = vNodeToDOM(vnode);

  if (domNode) {
    container.appendChild(domNode);
  }
}
