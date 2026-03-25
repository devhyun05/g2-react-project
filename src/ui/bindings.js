/**
 * 버튼 상태를 history 인덱스 기준으로 갱신한다.
 *
 * @param {{ undoButton: HTMLButtonElement, redoButton: HTMLButtonElement }} elements
 * @param {{ entries: unknown[], index: number } | null} history
 */
export function syncHistoryButtons(elements, history) {
  const hasHistory = Boolean(history) && Array.isArray(history.entries);
  const canUndo = hasHistory && history.index > 0;
  const canRedo = hasHistory && history.index < history.entries.length - 1;

  elements.undoButton.disabled = !canUndo;
  elements.redoButton.disabled = !canRedo;
}

/**
 * 상태 텍스트를 화면에 반영한다.
 *
 * @param {HTMLElement} target
 * @param {string} message
 */
export function setStatusText(target, message) {
  target.textContent = message;
}

/**
 * QA 체크리스트를 렌더한다.
 *
 * @param {HTMLElement} target
 * @param {string[]} checklist
 */
export function renderPatchLog(target, patches) {
  if (!Array.isArray(patches) || patches.length === 0) {
    target.textContent = "변경된 patch가 없습니다.";
    return;
  }

  target.textContent = patches
    .map((patch, index) => `${index + 1}. ${JSON.stringify(patch, null, 2)}`)
    .join("\n\n");
}

/**
 * history 이동 로그를 화면에 렌더한다.
 *
 * @param {HTMLElement} target
 * @param {string} action
 * @param {number} fromIndex
 * @param {number} toIndex
 */
export function renderHistoryLog(target, action, fromIndex, toIndex) {
  target.textContent = [
    `${action}: state history 이동`,
    `from index: ${fromIndex}`,
    `to index: ${toIndex}`,
    "실제 영역과 테스트 영역이 해당 Virtual DOM 상태로 함께 동기화되었습니다.",
  ].join("\n");
}

/**
 * VNode 트리를 화면에 렌더한다.
 *
 * @param {HTMLElement} target
 * @param {unknown} vnode
 */
export function renderVNodeTree(target, vnode) {
  target.replaceChildren(createVNodeTreeElement(vnode));
}

/**
 * @param {unknown} vnode
 * @returns {HTMLElement}
 */
function createVNodeTreeElement(vnode) {
  const root = document.createElement("div");
  root.className = "vnode-tree-empty";

  if (!vnode || typeof vnode !== "object") {
    root.textContent = "(empty)";
    return root;
  }

  const list = document.createElement("ul");
  list.className = "vnode-tree";
  list.appendChild(createVNodeTreeItem(vnode));
  return list;
}

/**
 * @param {unknown} vnode
 * @returns {HTMLLIElement}
 */
function createVNodeTreeItem(vnode) {
  const item = document.createElement("li");
  const type = typeof vnode.type === "string" ? vnode.type : "UNKNOWN";
  const props = vnode.props && typeof vnode.props === "object" ? vnode.props : {};
  const children = Array.isArray(vnode.children) ? vnode.children : [];

  const node = document.createElement("div");
  node.className = "tree-node";

  const dot = document.createElement("span");
  dot.className = "tree-dot";
  dot.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "tree-label";
  label.textContent =
    Object.keys(props).length > 0 ? `${type} ${JSON.stringify(props)}` : type;

  node.append(dot, label);
  item.appendChild(node);

  if (children.length > 0) {
    const childList = document.createElement("ul");
    children.forEach((child) => {
      childList.appendChild(createVNodeTreeItem(child));
    });
    item.appendChild(childList);
  }

  return item;
}

/**
 * 공통 버튼 이벤트를 연결한다.
 *
 * @param {{
 *   patchButton: HTMLButtonElement,
 *   undoButton: HTMLButtonElement,
 *   redoButton: HTMLButtonElement
 * }} elements
 * @param {{
 *   onPatch: () => void,
 *   onUndo: () => void,
 *   onRedo: () => void
 * }} handlers
 */
export function bindControls(elements, handlers) {
  elements.patchButton.addEventListener("click", handlers.onPatch);
  elements.undoButton.addEventListener("click", handlers.onUndo);
  elements.redoButton.addEventListener("click", handlers.onRedo);
}
