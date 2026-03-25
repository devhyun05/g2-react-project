export function domToVNode(node) {
  if (!node) return null;

  if (node.nodeType === Node.TEXT_NODE) {
    return {
      type: "TEXT",
      props: {
        nodeValue: String(node.textContent ?? ""),
      },
      children: [],
    };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const props = {};
  for (const attr of Array.from(node.attributes || [])) {
    const name = attr.name;
    if (name === "key") continue;
    if (name === "class") {
      props.className = attr.value;
      continue;
    }
    props[name] = attr.value;
  }

  const children = Array.from(node.childNodes || [])
    .map(domToVNode)
    .filter(Boolean);

  return {
    type: node.tagName.toLowerCase(),
    props,
    children,
  };
}