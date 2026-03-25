# Development Plan

이 문서는 수요 코딩회 과제(VDOM + Diff + Patch + History + UI) 기준 최소 구현 중심 개발 계획과 모듈 경계를 정리한다.

## Project Direction

- 목표: 하루 안에 데모 가능한 VDOM playground를 완성한다.
- 전략: Cycle 1에서 최소 동작 경로를 먼저 end-to-end로 연결한다.
- 원칙: 설계 과잉보다 계약 고정 -> 병렬 구현 -> 통합 검증 순서로 진행한다.
- 합의: 공개 계약(VNode/Patch/시그니처)은 깨지지 않게 유지한다.

## Mandatory Pre-Read

코드 작성 전 아래 문서를 먼저 읽는다.

- `README.md`
- `AGENTS.md`

현재 저장소에는 `AGENTS.md`가 없으므로, 코딩 시작 전에 팀이 해당 문서를 추가/확정해야 한다.

## Cycle Rules

### Cycle 1

- 최소 동작 구현을 최우선으로 한다.
- 로직은 단순하게 유지한다.
- 계약을 깨뜨릴 수 있는 고급 동작은 도입하지 않는다.

### Cycle 2

- 공개 계약을 유지한다.
- 안정화, 테스트, 통합 안전성 강화에 집중한다.
- 재설계보다 개선(refine)을 우선한다.

### Cycle 3

- 공개 계약을 유지한다.
- 비호환을 만들지 않는 범위에서 고급 개선을 추가한다.
- 가시성(inspectability), 문서, 데모 완성도를 우선한다.

## Fixed Contract Baseline

아래 항목은 Cycle 1 시작 시점 고정 규칙이다.

### 1) VNode Contract

TEXT 노드는 반드시 아래 포맷을 사용한다.

```js
{
  type: "TEXT",
  props: { nodeValue: string },
  children: []
}
```

ELEMENT 노드 포맷:

```js
{
  type: "div", // lowercase tag
  props: { ...attributes },
  children: []
}
```

공통 규칙:

- `props`는 항상 객체
- `children`은 항상 배열
- 텍스트 비교는 `props.nodeValue` 기준

### 2) DOM <-> VNode Mapping Rules

- DOM 읽기(`domToVNode`) 시 `class` -> `className` 변환
- DOM 렌더(`vNodeToDOM`, `patch`) 시 `className` -> `class` 변환
- Cycle 1에서는 이벤트 핸들러(`onClick` 등) 무시

### 3) Diff/Patch Rules

- key-based diff 금지
- children 비교는 index 기반만 허용
- path는 배열 인덱스 경로 사용
- patch type은 아래만 허용:
  - `CREATE`
  - `REMOVE`
  - `REPLACE`
  - `TEXT`
  - `SET_PROP`
  - `REMOVE_PROP`

patch payload 세부 필드명은 `AGENTS.md` 계약을 source of truth로 사용한다.

### 4) Function Signatures (Cycle 1)

- `domToVNode(domNode)`
- `vNodeToDOM(vnode)`
- `render(vnode, container)`
- `diff(oldVNode, newVNode) -> Patch[]`
- `applyPatches(rootEl, patches)`
- `getDOMNodeByPath(rootEl, path)`
- `createHistory()`
- `pushHistory(history, vnode)`
- `undoHistory(history)`
- `redoHistory(history)`
- `getCurrentVNode(history)`

## Branch and Merge Flow

- 기본 흐름: `개인 브랜치 -> dev PR -> dev -> main PR`
- 모든 작업은 개인 브랜치에서 진행하고 PR로만 반영한다.
- PR 생성/갱신 전 `origin/dev`를 fetch 후 rebase(또는 `pull --rebase`)로 최신 상태를 반영한다.
- `main`은 항상 데모 가능한 상태를 유지한다.

## Cycle 1 Work Protocol (All Agents)

- 코드 작성 전 `README.md`, `AGENTS.md`를 읽는다.
- 작업 시작 코멘트에 inferred contract를 짧게 요약한다.
- 반드시 본인 소유 파일 범위 안에서만 구현한다.
- 공개 계약(VNode/Patch/함수 시그니처)을 임의 변경하지 않는다.
- 지정되지 않은 고급 동작(예: key-based diff)은 구현하지 않는다.

## Team Structure (Cycle 1, 4인)

### Agent 1. VDOM 변환/렌더

소유 파일:

- `src/core/types.js`
- `src/core/domToVNode.js`
- `src/core/vNodeToDOM.js`
- `src/core/render.js`

책임:

- DOM -> VNode 변환
- VNode -> DOM 변환
- 전체 렌더링 (`render`)
- TEXT 노드/`class` 매핑 계약 준수
- comment node 무시
- event handler 무시

필수 구현:

- `domToVNode(domNode)`
  - `ELEMENT_NODE`, `TEXT_NODE` 지원
  - TEXT: `{ type: "TEXT", props: { nodeValue }, children: [] }`
  - ELEMENT: `{ type: tagName(lowercase), props, children }`
- `vNodeToDOM(vnode)`
  - TEXT면 `Text` 노드 생성
  - `className -> class` 매핑
- `render(vnode, container)`
  - container 비우기
  - 전체 DOM 트리 append

최소 테스트:

- simple element
- nested element
- mixed text + element
- round-trip sanity(선택)

제외:

- diff/patch/history 구현 금지

### Agent 2. Diff 알고리즘

소유 파일:

- `src/core/diff.js`

책임:

- `diff(oldVNode, newVNode) -> Patch[]`
- TEXT 비교(`props.nodeValue`)
- props 변경/삭제 patch 생성
- children index 기반 재귀 비교
- nested path 정확도 보장

필수 규칙:

- old missing -> `CREATE`
- new missing -> `REMOVE`
- type 다름 -> `REPLACE`
- TEXT 변경 -> `TEXT`
- new/changed prop -> `SET_PROP`
- removed prop -> `REMOVE_PROP`
- `props.nodeValue`는 일반 props처럼 처리하지 않음

최소 테스트:

- text change
- prop change
- prop removal
- child add/remove
- replace
- nested path correctness

제외:

- DOM 조작/History/UI 구현 금지

### Agent 3. Patch 적용/History

소유 파일:

- `src/core/patch.js`
- `src/core/history.js`

책임:

- `applyPatches(rootEl, patches)`
- `getDOMNodeByPath(rootEl, path)`
- patch type 전부 처리
- snapshot 기반 history (`entries`, `index`)
- undo/redo, future truncation

필수 구현:

- `TEXT`: `nodeValue` 또는 `textContent` 갱신
- `SET_PROP`: `setAttribute` 사용, `className -> class` 매핑
- `REMOVE_PROP`: `removeAttribute`
- `CREATE`: append 또는 insert
- `REMOVE`: 대상 노드 제거
- `REPLACE`: `replaceWith`
- 금지: `innerHTML` 전체 교체

History 함수:

- `createHistory`
- `pushHistory`
- `undoHistory`
- `redoHistory`
- `getCurrentVNode`

History 규칙:

- 구조: `{ entries: VNode[], index: number }`
- snapshot 기반
- undo 후 push 시 future entries 제거

최소 테스트:

- patch text
- patch props
- create/remove/replace
- nested path
- history push/undo/redo
- future truncation

제외:

- diff 알고리즘 변경 금지
- UI 이벤트 바인딩 구현 금지

### Agent 4. UI 통합/검증

소유 파일:

- `index.html`
- `style.css`
- `src/ui/app.js`
- `src/ui/bindings.js`
- `src/ui/fixtures.js`

책임:

- 실제 영역(`#real-root`) / 테스트 영역(`#test-root`) 구성
- `Patch`, `Undo`, `Redo` 버튼 연결
- 모듈 import 기반 통합
- 수동 테스트 체크리스트(또는 기본 통합 테스트) 작성

필수 흐름:

1. On load
   - real DOM 읽기 -> `domToVNode`
   - 생성된 vnode를 test 영역에 렌더
   - history 초기화
2. On Patch
   - test DOM 읽기 -> new vnode 생성
   - `diff(oldVNode, newVNode)`
   - `applyPatches(realRoot, patches)`
   - history push
3. On Undo/Redo
   - history index 이동
   - current vnode를 real/test 둘 다 렌더

UI 최소 구성:

- `#real-root`
- `#test-root`
- Patch 버튼
- Undo 버튼
- Redo 버튼

제외:

- core 로직 재구현 금지

## Cycle 1 Integration Order

1. 공용 계약(VNode/Patch/path/시그니처) 최종 확인
2. Agent 1/2/3이 병렬 구현 (mock 기반 허용)
3. Agent 4가 UI 골격과 이벤트 흐름 연결
4. 통합 시나리오로 patch/undo/redo end-to-end 검증
5. 계약 변경 필요 시 코드 선변경 대신 문서/팀 합의 우선

## Cycle 1 Minimum Test Matrix

- simple element 변환/렌더
- nested element 변환/렌더
- mixed text + element 변환/렌더
- text change diff/patch
- prop change/prop removal
- child add/remove
- replace
- nested path correctness
- undo/redo + future truncation

## Cycle 2 Focus

- 공개 계약 유지 상태에서 테스트 보강
- 통합 안정성 강화(회귀 케이스 확장)
- UI/문서 개선, 데모 경로 단순화

## Cycle 3 Focus

- 비호환 없는 개선만 추가
- 로그/디버깅 가시성 강화
- 최종 발표 기준 문서/시연 품질 마감

## Definition of Done

- 현재 사이클 목표가 end-to-end로 동작한다.
- 계약 위반 없이 테스트가 통과한다.
- README/관련 문서가 실제 동작과 일치한다.
- 다음 사이클 담당자가 이어받을 수 있도록 변경 의도를 PR에 남긴다.
