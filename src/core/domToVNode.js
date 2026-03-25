import { createTextVNode, createVNode } from "./types.js";

function getPropsFromAttributes(attributes) {
  const props = {};

  for (const attribute of attributes) {
    const name = attribute.name === "class" ? "className" : attribute.name;
    props[name] = attribute.value;
  }

  return props;
}

export function domToVNode(domNode) {
  if (!domNode) {
    return null;
  }

  if (domNode.nodeType === Node.TEXT_NODE) {
    return createTextVNode(domNode.nodeValue ?? "");
  }

  if (domNode.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const children = [];

  for (const childNode of domNode.childNodes) {
    if (childNode.nodeType === Node.COMMENT_NODE) {
      continue;
    }

    const childVNode = domToVNode(childNode);

    if (childVNode) {
      children.push(childVNode);
    }
  }

  return createVNode(
    domNode.tagName.toLowerCase(),
    getPropsFromAttributes(domNode.attributes),
    children
  );
}
