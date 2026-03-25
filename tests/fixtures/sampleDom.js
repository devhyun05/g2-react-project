import { createTestDocument } from "../helpers/fakeDom.js";

export function createSampleDocument() {
  return createTestDocument();
}

export function createSampleDOMTree() {
  const document = createTestDocument();
  const root = document.createElement("section");
  root.setAttribute("class", "card");
  root.setAttribute("data-kind", "article");

  const title = document.createElement("h2");
  title.appendChild(document.createTextNode("Weekly menu"));

  const lead = document.createElement("p");
  lead.setAttribute("class", "lead");
  lead.appendChild(document.createTextNode("Kimchi stew"));

  const list = document.createElement("ul");
  const first = document.createElement("li");
  first.appendChild(document.createTextNode("Egg roll"));
  const second = document.createElement("li");
  second.appendChild(document.createTextNode("Seaweed soup"));
  list.appendChild(first);
  list.appendChild(second);

  root.appendChild(document.createComment("ignored comment"));
  root.appendChild(title);
  root.appendChild(lead);
  root.appendChild(list);

  return { document, root };
}

export function createPlaygroundElements(document) {
  const realRoot = document.createElement("div");
  realRoot.setAttribute("id", "real-root");
  const testRoot = document.createElement("textarea");
  testRoot.setAttribute("id", "test-root");
  const vnodeTree = document.createElement("div");
  vnodeTree.setAttribute("id", "vnode-tree");
  const patchLog = document.createElement("pre");
  patchLog.setAttribute("id", "patch-log");
  const patchButton = document.createElement("button");
  patchButton.setAttribute("id", "patch-button");
  const undoButton = document.createElement("button");
  undoButton.setAttribute("id", "undo-button");
  const redoButton = document.createElement("button");
  redoButton.setAttribute("id", "redo-button");
  const statusText = document.createElement("span");
  statusText.setAttribute("id", "status-text");

  document.body.appendChild(realRoot);
  document.body.appendChild(testRoot);
  document.body.appendChild(vnodeTree);
  document.body.appendChild(patchLog);
  document.body.appendChild(patchButton);
  document.body.appendChild(undoButton);
  document.body.appendChild(redoButton);
  document.body.appendChild(statusText);

  return {
    realRoot,
    testRoot,
    vnodeTree,
    patchLog,
    patchButton,
    undoButton,
    redoButton,
    statusText,
  };
}
