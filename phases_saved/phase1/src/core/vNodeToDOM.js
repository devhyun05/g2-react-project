export function vNodeToDOM(vnode) {
  if (!vnode) return null;

  if (vnode.type === "TEXT") {
    return document.createTextNode(String(vnode.props?.nodeValue ?? ""));
  }

  const element = document.createElement(vnode.type);
  const props = vnode.props || {};

  for (const key of Object.keys(props)) {
    const value = props[key];
    if (value === false || value === null || value === undefined) continue;

    if (key === "className") {
      element.setAttribute("class", String(value));
      continue;
    }

    element.setAttribute(key, String(value));
  }

  for (const child of vnode.children || []) {
    const childNode = vNodeToDOM(child);
    if (childNode) {
      element.appendChild(childNode);
    }
  }

  return element;
}