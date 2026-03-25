import { vNodeToDOM } from "./vNodeToDOM.js";

export function applyPatches(root, patches) {
  if (!root || !Array.isArray(patches)) return;

  const ordered = [...patches].sort((a, b) => b.path.length - a.path.length);

  for (const patch of ordered) {
    switch (patch.kind) {
      case "CREATE": {
        if (patch.path.length === 0) {
          root.appendChild(vNodeToDOM(patch.node));
          break;
        }
        const parent = getNodeByPath(root, patch.path.slice(0, -1));
        const index = patch.path[patch.path.length - 1];
        const dom = vNodeToDOM(patch.node);
        if (!parent || !dom) break;
        const ref = parent.childNodes[index] || null;
        parent.insertBefore(dom, ref);
        break;
      }
      case "REMOVE": {
        if (patch.path.length === 0) {
          if (root.firstChild) root.removeChild(root.firstChild);
          break;
        }
        const parent = getNodeByPath(root, patch.path.slice(0, -1));
        const target = getNodeByPath(root, patch.path);
        if (parent && target) parent.removeChild(target);
        break;
      }
      case "REPLACE": {
        const nextNode = vNodeToDOM(patch.node);
        if (patch.path.length === 0) {
          if (root.firstChild) root.replaceChild(nextNode, root.firstChild);
          else root.appendChild(nextNode);
          break;
        }
        const parent = getNodeByPath(root, patch.path.slice(0, -1));
        const target = getNodeByPath(root, patch.path);
        if (parent && target && nextNode) {
          parent.replaceChild(nextNode, target);
        }
        break;
      }
      case "TEXT": {
        const target = getNodeByPath(root, patch.path);
        if (target && target.nodeType === Node.TEXT_NODE) {
          target.textContent = String(patch.text ?? "");
        }
        break;
      }
      case "SET_PROP": {
        const target = getNodeByPath(root, patch.path);
        if (target && target.setAttribute) {
          const key = patch.key;
          const value = patch.value;
          if (value === false || value === null || value === undefined) {
            target.removeAttribute(key);
          } else {
            if (key === "className") {
              target.setAttribute("class", String(value));
            } else {
              target.setAttribute(String(key), String(value));
            }
          }
        }
        break;
      }
      case "REMOVE_PROP": {
        const target = getNodeByPath(root, patch.path);
        if (target && target.removeAttribute) target.removeAttribute(patch.key);
        break;
      }
    }
  }
}

function getNodeByPath(root, path) {
  let node = root;
  for (const index of path) {
    if (!node || !node.childNodes || index < 0 || index >= node.childNodes.length) {
      return null;
    }
    node = node.childNodes[index];
  }
  return node;
}

