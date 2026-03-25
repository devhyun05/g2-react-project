# AGENTS.md

이 파일은 4명의 개발자가 **Codex에게 일관된 맥락을 전달하기 위한 작업 지침서**다.  
각 담당자는 자신의 역할에 맞는 프롬프트를 사용하되, 아래 공통 규약을 절대 어기면 안 된다.

---

## Required Reading

변경을 시작하기 전에 아래 문서를 순서대로 읽는다.

1. `AGENTS.md`
2. `README.md`
3. `docs/development-plan.md`
4. `docs/commit-convention.md`
5. `docs/vnode-spec-v1.0.md`
6. `docs/text-node-rules-v1.0.md`

문서를 읽지 않은 상태에서 구현을 시작하지 않는다.

---

## 1. 공통 미션

우리는 Vanilla JavaScript로 다음을 구현한다.

- 실제 DOM -> Virtual DOM 변환
- Virtual DOM -> 실제 DOM 렌더링
- 두 Virtual DOM 간 diff
- patch를 통한 실제 DOM 부분 업데이트
- state history 기반 undo / redo
- 이를 검증할 수 있는 playground UI

목표는 “돌아가는 코드”가 아니라, **4명이 병렬 작업해도 안전하게 merge되는 구조**다.

---

## 2. 공통 우선순위

Codex에게 항상 다음 우선순위를 지키게 한다.

1. README.md의 데이터 구조와 함수 시그니처를 절대 우선
2. 독립 모듈 구현
3. contract test 통과
4. 읽기 쉬운 코드
5. 확장 가능성
6. 성능 미세 최적화는 마지막

---

## 3. 절대 변경 금지 항목

다음 항목은 담당자가 임의 변경하면 안 된다.

- `VNode` 포맷
- `Patch` 포맷
- 함수 시그니처
- path 규칙
- HistoryState 포맷
- 폴더 구조의 핵심 계약
- patch 종류 이름 (`CREATE`, `REMOVE`, `REPLACE`, `TEXT`, `SET_PROP`, `REMOVE_PROP`)

변경이 필요하면 먼저 문서를 수정하는 PR을 별도로 제안해야 한다.

---

## 4. 공통 규칙

### 4.1 구현 원칙
- ESM 기반으로 작성
- 순수 함수 우선
- side effect는 최소화
- helper를 적극 분리
- JSDoc 작성
- 입력/출력 타입을 명확하게 유지
- 명시적인 예외 처리

### 4.2 금지 사항
- `innerHTML = ...` 전체 치환으로 patch 구현 대체 금지
- 임의의 데이터 포맷 도입 금지
- README에 없는 patch 타입 추가 금지
- root/path 규칙 무시 금지
- UI 레이어에서 core 로직을 중복 구현 금지

### 4.3 허용 사항
- 내부 helper 함수 추가
- 테스트용 fixture 추가
- debug logging 추가
- README 계약을 유지하는 선에서 내부 구현 최적화

---

## 5. 공통 인터페이스 계약

### VNode
```js
{
  nodeKind: "ELEMENT" | "TEXT",
  type: string,
  props: Record<string, string>,
  children: VNode[],
  text: string | null,
  key: string | null
}
```

### Patch
```js
{ kind: "CREATE", path: number[], node: VNode }
{ kind: "REMOVE", path: number[] }
{ kind: "REPLACE", path: number[], node: VNode }
{ kind: "TEXT", path: number[], text: string }
{ kind: "SET_PROP", path: number[], key: string, value: string }
{ kind: "REMOVE_PROP", path: number[], key: string }
```

### 함수 시그니처
```js
domToVNode(domNode): VNode
vNodeToDOM(vnode): Node
render(vnode, container): Node
diff(oldVNode, newVNode): Patch[]
applyPatches(rootEl, patches): void

createHistory(initialVNode): HistoryState
pushHistory(history, nextVNode): HistoryState
undoHistory(history): HistoryState
redoHistory(history): HistoryState
getCurrentVNode(history): VNode
```

---

## 6. 역할별 작업 규칙

## Agent A — VDOM / Render
담당:
- `src/core/types.js`
- `src/core/domToVNode.js`
- `src/core/vNodeToDOM.js`
- `src/core/render.js`

작업 목표:
- 실제 DOM을 정확한 `VNode`로 변환
- `VNode`를 다시 실제 DOM으로 생성
- render가 container를 비우고 새 트리를 마운트

핵심 검증:
- text node 보존
- attributes 누락 없음
- DOM -> VDOM -> DOM 왕복 가능

주의:
- comment node는 무시 가능
- style은 문자열 그대로 유지
- key는 optional field지만 포맷 유지

Codex에게 기대하는 결과:
- 작은 helper 함수들로 분리된 구현
- fixture 기반 unit test
- text node 케이스 충분히 포함

---

## Agent B — Diff
담당:
- `src/core/diff.js`

작업 목표:
- 두 `VNode`를 비교해 `Patch[]` 생성
- 재귀적 children diff 구현
- index 기반 children 전략 우선 적용

핵심 검증:
- create/remove/replace/text/set_prop/remove_prop 생성
- nested diff 가능
- path 계산 일관성

주의:
- path는 old tree 기준
- patch 포맷 변경 금지
- reorder 최적화보다 일관성이 우선

Codex에게 기대하는 결과:
- 순수 함수
- helper: `diffNode`, `diffProps`, `diffChildren`
- fixture 기반 contract test

---

## Agent C — Patch / History
담당:
- `src/core/patch.js`
- `src/core/history.js`

작업 목표:
- patch format을 해석해서 실제 DOM 일부만 수정
- history snapshot 저장 / undo / redo 구현

핵심 검증:
- path 탐색 안정성
- root 처리 안정성
- undo 이후 새 patch 시 future entries 제거

주의:
- patch 적용 로직과 history 로직 분리
- root replace가 필요한 경우 wrapper 전략 고려
- state mutation 최소화

Codex에게 기대하는 결과:
- `getDOMNodeByPath` 같은 helper 분리
- edge case 처리
- history 불변 업데이트

---

## Agent D — UI / Integration / Verification
담당:
- `index.html`
- `style.css`
- `src/ui/app.js`
- `src/ui/bindings.js`
- `src/ui/fixtures.js`
- `src/ui/debug.js`
- `tests/**`

작업 목표:
- playground UI 구성
- patch / undo / redo 버튼 연결
- 테스트/검증 체계 구축
- 전체 merge 전 contract/integration 검증

핵심 검증:
- 초기 로드 흐름
- patch 시 real 영역만 변경
- undo/redo 시 real/test 동기화
- diff/patch 결과 확인 가능

주의:
- core 로직을 재작성하지 말고 import해서 사용
- mock/stub를 활용해 UI부터 독립 구축 가능
- merge gatekeeper 역할 수행

Codex에게 기대하는 결과:
- integration test 시나리오
- manual QA checklist
- debug panel 또는 patch log view

---

## 7. Codex 사용 원칙

각 담당자는 Codex에게 아래 원칙을 포함해서 요청한다.

1. README 계약을 먼저 읽고 그 계약에 맞는 코드만 생성할 것
2. 담당 파일 외에는 수정하지 말 것
3. 필요한 helper는 담당 범위 안에서만 추가할 것
4. 함수 시그니처와 포맷은 유지할 것
5. 테스트도 함께 생성할 것
6. 구현 이유를 주석 또는 짧은 설명으로 남길 것

---

## 8. PR 기준

각 PR은 아래를 만족해야 한다.

- 담당 범위 외 파일 변경 최소화
- README 계약 준수
- 테스트 포함
- 예외 케이스 확인
- 샘플 fixture 포함
- diff가 읽기 쉬움

### PR 체크리스트
- [ ] 함수 시그니처 유지
- [ ] VNode/Patch 포맷 유지
- [ ] contract test 추가 또는 통과
- [ ] edge case 포함
- [ ] 문서와 충돌 없음

---

## 9. 공통 테스트 우선순위

### Contract Test
공통 계약이 지켜지는지 확인한다.
- VNode shape
- Patch shape
- history shape
- 함수 반환값

### Unit Test
모듈 단위 로직 검증
- domToVNode
- vNodeToDOM
- diff
- patch
- history

### Integration Test
전체 흐름 검증
- 초기 로드
- patch
- undo/redo
- UI 동기화

---

## 10. merge 전 최종 검증

마지막 merge 전 반드시 확인한다.

1. Agent A 결과로 sample DOM이 정확히 VDOM화되는가
2. Agent B 결과로 diff patch가 기대대로 생성되는가
3. Agent C 결과로 patch가 실제 DOM 일부만 변경하는가
4. Agent C 결과로 history가 안정적으로 동작하는가
5. Agent D 결과로 전체 UI 흐름이 자연스럽게 연결되는가
6. undo/redo와 새 patch 조합에서 history가 꼬이지 않는가

---

## 11. 작업 방식 추천

1. 먼저 README 계약 동결
2. 각자 담당 모듈 독립 구현
3. contract test로 1차 검증
4. integration branch에서 조립
5. 최종 UI/debug/test 보강

---

## 12. Codex에게 기대하는 난이도

이번 프로젝트는 쉬운 데모가 아니라, **조금 더 어려운 버전의 구조화된 구현**을 목표로 한다.

따라서 Codex에게는:
- 모듈 분리
- helper 분리
- 테스트 포함
- edge case 대응
- root/path/history 안정성
- 확장 가능한 구조

를 요구한다.

단, README 계약을 깨는 추상화는 금지다.
