import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";

import { diff } from "../src/core/diff.js";
import {
  createHistory,
  getCurrentVNode,
  pushHistory,
  undoHistory,
} from "../src/core/history.js";
import { applyPatches } from "../src/core/patch.js";
import { render } from "../src/core/render.js";
import { installDOMGlobals, serializeNode } from "./helpers/fakeDom.js";
import {
  createListTree,
  createMutatedListTree,
  createNestedTree,
} from "./helpers/treeFactory.js";
import { vNodeToDOM } from "../src/core/vNodeToDOM.js";

installDOMGlobals();

const rows = [];

function measure(name, fn) {
  const startedAt = performance.now();
  const details = fn();
  const elapsedMs = (performance.now() - startedAt).toFixed(3);
  rows.push({
    scenario: name,
    elapsed_ms: elapsedMs,
    details,
  });
}

measure("large_diff_nested_tree", () => {
  const oldTree = createNestedTree(5, 3, "load");
  const newTree = structuredClone(oldTree);
  newTree.children[1].children[2].props.className = "depth-2-hot";
  newTree.children[2].children[1].children[1].children[0].children[2].props.nodeValue =
    "load:mutation";
  const patches = diff(oldTree, newTree);
  return `patches=${patches.length}`;
});

measure("sequential_patch_loop_40x120", () => {
  let currentTree = createListTree(120);
  const root = vNodeToDOM(currentTree);

  for (let index = 0; index < 40; index += 1) {
    const nextTree = createMutatedListTree(120, {
      prefix: `round${index}`,
      changedEvery: (index % 5) + 2,
      appendCount: 0,
      className: `load-list phase-${index}`,
    });
    applyPatches(root, diff(currentTree, nextTree));
    currentTree = nextTree;
  }

  return `final_html_length=${serializeNode(root).length}`;
});

measure("render_history_loop_60x50", () => {
  const container = document.createElement("div");
  let history = createHistory(createListTree(50));

  for (let index = 0; index < 60; index += 1) {
    const nextTree = createMutatedListTree(50, {
      prefix: `history-${index}`,
      changedEvery: 2 + (index % 4),
    });
    render(nextTree, container);
    history = pushHistory(history, nextTree);
    if (index % 4 === 0) {
      history = undoHistory(history);
      history = pushHistory(history, nextTree);
    }
  }

  return `entries=${history.entries.length},current_html_length=${serializeNode(vNodeToDOM(getCurrentVNode(history))).length}`;
});

measure("rapid_button_dispatch_200_ops", () => {
  const patchButton = document.createElement("button");
  const undoButton = document.createElement("button");
  const redoButton = document.createElement("button");
  let count = 0;

  patchButton.addEventListener("click", () => {
    count += 1;
  });
  undoButton.addEventListener("click", () => {
    count += 1;
  });
  redoButton.addEventListener("click", () => {
    count += 1;
  });

  for (let index = 0; index < 100; index += 1) {
    patchButton.click();
    if (index % 2 === 0) {
      undoButton.click();
    }
    if (index % 4 === 0) {
      redoButton.click();
    }
  }

  return `events=${count}`;
});

const csv = [
  "scenario,elapsed_ms,details",
  ...rows.map((row) => `${row.scenario},${row.elapsed_ms},"${row.details}"`),
].join("\n");

writeFileSync("tests/load-results.csv", csv, "utf8");
console.log(csv);
