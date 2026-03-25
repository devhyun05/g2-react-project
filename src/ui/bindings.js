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
export function renderChecklist(target, checklist) {
  const fragment = document.createDocumentFragment();

  checklist.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    fragment.appendChild(li);
  });

  target.replaceChildren(fragment);
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
