export const fallbackMessages = {
  loading: "코어 모듈을 불러오는 중입니다.",
  ready: "테스트 영역을 수정한 뒤 Patch를 눌러 실제 영역에 최소 변경만 반영하세요.",
  patchApplied: (count) => `diff 결과 patch ${count}개를 실제 영역에 반영했습니다.`,
  undoApplied: "이전 snapshot으로 되돌렸습니다.",
  redoApplied: "다음 snapshot으로 이동했습니다.",
  noUndo: "더 이상 undo할 snapshot이 없습니다.",
  noRedo: "더 이상 redo할 snapshot이 없습니다.",
  missingRoot: "렌더링할 루트 노드를 찾지 못했습니다.",
  invalidHtmlRoot: "테스트 영역 HTML은 루트 노드가 하나여야 합니다.",
  invalidHtmlParse: "테스트 영역 HTML을 DOM으로 변환하지 못했습니다.",
  noPatchChanges: "변경된 부분이 없습니다. patch 없이 현재 상태를 유지합니다.",
  importError:
    "src/core 모듈을 불러오지 못했습니다. 코어 모듈이 병합되면 playground가 동작합니다.",
};
