import test from "node:test";
import assert from "node:assert/strict";
import {
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  getCurrentVNode,
} from "../../src/core/history.js";

function vnode(id) {
  return { type: "div", props: { id }, children: [] };
}

test("createHistory는 빈 history state를 만든다", () => {
  const history = createHistory();
  assert.deepEqual(history, { entries: [], index: -1 });
  assert.equal(getCurrentVNode(history), null);
});

test("pushHistory는 snapshot을 추가하고 getCurrentVNode는 복제본을 반환한다", () => {
  const original = vnode("A");
  const history = pushHistory(createHistory(), original);

  original.props.id = "MUTATED_OUTSIDE";
  const current = getCurrentVNode(history);
  assert.equal(current.props.id, "A");

  current.props.id = "MUTATED_RETURN";
  assert.equal(getCurrentVNode(history).props.id, "A");
});

test("undoHistory와 redoHistory는 index를 이동시키며 현재 상태를 바꾼다", () => {
  const history0 = createHistory();
  const history1 = pushHistory(history0, vnode("A"));
  const history2 = pushHistory(history1, vnode("B"));

  const undone = undoHistory(history2);
  assert.equal(undone.index, 0);
  assert.equal(getCurrentVNode(undone).props.id, "A");

  const redone = redoHistory(undone);
  assert.equal(redone.index, 1);
  assert.equal(getCurrentVNode(redone).props.id, "B");
});

test("undo 이후 pushHistory를 호출하면 미래 엔트리를 잘라낸다", () => {
  const h0 = createHistory();
  const h1 = pushHistory(h0, vnode("A"));
  const h2 = pushHistory(h1, vnode("B"));
  const h3 = pushHistory(h2, vnode("C"));

  const undone = undoHistory(h3);
  const branched = pushHistory(undone, vnode("D"));

  assert.equal(branched.index, 2);
  assert.deepEqual(
    branched.entries.map((entry) => entry.props.id),
    ["A", "B", "D"],
  );
});

test("undo/redo는 경계에서 안전하게 현재 상태를 유지한다", () => {
  const empty = createHistory();
  assert.deepEqual(undoHistory(empty), empty);
  assert.deepEqual(redoHistory(empty), empty);

  const single = pushHistory(empty, vnode("ONLY"));
  assert.deepEqual(undoHistory(single), single);
  assert.deepEqual(redoHistory(single), single);
});

test("createHistory(initialVNode)는 초기 스냅샷을 만들고 외부 변이를 차단한다", () => {
  const initial = vnode("INIT");
  const history = createHistory(initial);

  initial.props.id = "MUTATED";
  assert.equal(history.index, 0);
  assert.equal(history.entries.length, 1);
  assert.equal(history.entries[0].props.id, "INIT");
  assert.equal(getCurrentVNode(history).props.id, "INIT");
});

test("pushHistory는 잘못된 history 입력도 정규화해서 처리한다", () => {
  const next = vnode("X");
  const result = pushHistory({ bad: true }, next);

  assert.equal(result.index, 0);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].props.id, "X");
});

test("pushHistory(nextVNode=undefined)는 기존 상태를 유지한다", () => {
  const h0 = pushHistory(createHistory(), vnode("A"));
  const h1 = pushHistory(h0, undefined);

  assert.deepEqual(h1, h0);
});

test("normalize 대상 index가 비정상이어도 undo/redo/getCurrentVNode가 안전하게 동작한다", () => {
  const malformedHigh = { entries: [vnode("A"), vnode("B")], index: 999 };
  const malformedLow = { entries: [vnode("A"), vnode("B")], index: -999 };

  assert.equal(getCurrentVNode(malformedHigh).props.id, "B");
  assert.equal(getCurrentVNode(malformedLow).props.id, "A");

  const undone = undoHistory(malformedHigh);
  assert.equal(undone.index, 0);
  assert.equal(getCurrentVNode(undone).props.id, "A");

  const redone = redoHistory(malformedLow);
  assert.equal(redone.index, 1);
  assert.equal(getCurrentVNode(redone).props.id, "B");
});
