export function createHistory() {
  const snapshots = [];
  let pointer = -1;

  function push(vnode) {
    snapshots.splice(pointer + 1);
    snapshots.push(vnode);
    pointer = snapshots.length - 1;
    return snapshots[pointer];
  }

  function undo() {
    if (pointer <= 0) return null;
    pointer -= 1;
    return snapshots[pointer];
  }

  function redo() {
    if (pointer >= snapshots.length - 1) return null;
    pointer += 1;
    return snapshots[pointer];
  }

  function current() {
    return pointer >= 0 ? snapshots[pointer] : null;
  }

  return { push, undo, redo, current, canUndo: () => pointer > 0, canRedo: () => pointer < snapshots.length - 1 };
}

