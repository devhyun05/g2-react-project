export const manualQaChecklist = [
  "text change: test 영역의 텍스트를 바꾼 뒤 Patch를 눌렀을 때 real 영역 텍스트도 같은 값으로 바뀌는지 확인",
  "prop change: test 영역 루트 요소의 class나 data-kind 값을 바꾼 뒤 Patch 적용 후 real 영역 속성이 반영되는지 확인",
  "child add/remove: test 영역에서 li를 추가하거나 삭제한 뒤 real 영역 자식 목록이 동일하게 바뀌는지 확인",
  "replace: test 영역의 루트 태그를 다른 태그로 교체한 뒤 real 영역도 동일하게 교체되는지 확인",
  "undo/redo: Patch 이후 Undo로 이전 상태로 돌아가고, Redo로 다시 최신 상태가 복원되는지 확인",
];

export const fallbackMessages = {
  loading: "코어 모듈을 불러오는 중입니다.",
  ready: "편집 후 Patch를 눌러 real DOM에 반영하세요.",
  patchApplied: (count) => `patch ${count}개를 real DOM에 적용했습니다.`,
  undoApplied: "이전 snapshot으로 되돌렸습니다.",
  redoApplied: "다음 snapshot으로 이동했습니다.",
  noUndo: "더 이상 undo할 snapshot이 없습니다.",
  noRedo: "더 이상 redo할 snapshot이 없습니다.",
  missingRoot: "렌더링할 루트 노드를 찾지 못했습니다.",
  importError:
    "src/core 모듈을 불러오지 못했습니다. 코어 모듈이 병합되면 playground가 동작합니다.",
};
