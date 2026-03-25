<div align="center">

# Virtual DOM Simulator

![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-f7df1e?style=for-the-badge&logo=javascript&logoColor=222)
![Virtual DOM](https://img.shields.io/badge/Focus-Virtual_DOM-22c55e?style=for-the-badge)
![Diff](https://img.shields.io/badge/Core-Diff_Algorithm-0ea5e9?style=for-the-badge)
![Patch](https://img.shields.io/badge/Core-Patch_Apply-f97316?style=for-the-badge)
![History](https://img.shields.io/badge/Feature-Undo_/_Redo-a855f7?style=for-the-badge)
![Tests](https://img.shields.io/badge/Quality-Edge_Case_Tested-ef4444?style=for-the-badge)

**실제 DOM -> Virtual DOM -> Diff -> Patch -> History -> UI 검증**  
Vanilla JavaScript로 구현한 구조화된 Virtual DOM 학습/검증 프로젝트

</div>

---

> [!NOTE]
> 이 프로젝트는 단순 데모가 아니라, 4명이 병렬 작업해도 안전하게 merge 가능한 구조와 테스트 중심 품질 검증을 목표로 만들었다.

## 팀 구성

<table>
  <tr>
    <th>Agent</th>
    <th>역할</th>
    <th>담당 파트</th>
  </tr>
  <tr>
    <td><strong>A</strong></td>
    <td>VDOM / Render</td>
    <td>실제 DOM ↔ VNode 변환, 렌더링</td>
  </tr>
  <tr>
    <td><strong>B</strong></td>
    <td>Diff</td>
    <td>이전/다음 VNode 비교, patch 생성</td>
  </tr>
  <tr>
    <td><strong>C</strong></td>
    <td>Patch / History</td>
    <td>실제 DOM 부분 업데이트, undo / redo</td>
  </tr>
  <tr>
    <td><strong>D</strong></td>
    <td>UI / Integration / Verification</td>
    <td>playground UI, 버튼 연결, 통합 검증, 테스트</td>
  </tr>
</table>

이 역할 분리는 `AGENTS.md` 기준으로 나뉘며, 핵심 포맷과 함수 계약은 개인 판단으로 바꾸지 않는 방식으로 협업했다.

## 우리가 중점으로 둔 것

```text
계약 우선 -> 모듈 분리 -> 최소 변경 반영 -> history 안정성 -> 테스트 검증
```

이 프로젝트는 단순히 "화면이 바뀌는가"보다 아래 기준을 더 중요하게 봤다.

- 여러 명이 병렬 작업해도 merge 가능한 구조인가
- core 로직과 UI 로직이 명확히 분리되어 있는가
- 문서 계약을 끝까지 지키는가
- 테스트로 동작을 재현하고 증명할 수 있는가
- 일반적인 상황뿐 아니라 edge case와 반복 실행 상황에서도 안전한가

즉, 데모 코드가 아니라 "구조화된 구현"을 목표로 진행했다.

## AGENTS.md를 어떻게 반영했는가

> [!TIP]
> 핵심은 "형식 고정 + 역할 분리 + 테스트 포함 + edge case 대응"이었다.

`AGENTS.md`의 핵심은 계약 우선, 모듈 분리, 테스트 포함, edge case 대응이다. README도 이 기준에 맞춰 정리했다.

- VNode, Patch, HistoryState의 포맷을 고정했다.
- patch 종류는 `CREATE`, `REMOVE`, `REPLACE`, `TEXT`, `SET_PROP`, `REMOVE_PROP`만 사용했다.
- path 규칙은 diff와 patch 전체에서 일관되게 유지했다.
- UI에서 core 로직을 다시 구현하지 않고 import해서 사용했다.
- 각 파트가 helper 단위로 분리되어 테스트 가능하도록 만들었다.
- 기능 구현과 함께 contract / unit / integration 테스트를 같이 작성했다.

## 핵심 로직 설명

### 흐름 한눈에 보기

```text
Real DOM
  -> VNode로 정규화
  -> 이전 VNode / 다음 VNode 비교
  -> path 기반 patch 생성
  -> 실제 DOM에 부분 반영
  -> snapshot 저장
  -> undo / redo로 복원
```

### 1. Virtual DOM 변환

실제 DOM을 읽을 때는 element와 text node를 공통된 VNode 구조로 바꾼다.  
text node는 문자열로 따로 두지 않고 반드시 `TEXT` 타입 VNode로 다룬다.  
이 방식 덕분에 렌더링, diff, patch, history가 모두 같은 데이터 구조를 기준으로 동작한다.

또한 comment node는 무시하고, `class`는 `className`으로 통일해 다룬다.  
즉, "DOM마다 제각각인 형태"를 "비교 가능한 공통 구조"로 정규화하는 것이 첫 번째 핵심이다.

### 2. Diff 알고리즘

diff는 이전 트리와 다음 트리를 재귀적으로 비교한다.

- 노드가 없으면 `CREATE`
- 새 노드가 없으면 `REMOVE`
- 타입이 다르면 `REPLACE`
- text 내용이 달라지면 `TEXT`
- 속성이 바뀌면 `SET_PROP` / `REMOVE_PROP`

children 비교는 key 기반이 아니라 index 기반으로 처리했다. 이 프로젝트에서는 고급 최적화보다 path 일관성과 예측 가능한 patch 생성이 더 중요했기 때문이다.

즉, diff 알고리즘의 핵심은 "두 트리의 차이를 path 기반 patch 목록으로 바꾸는 것"이다.

### 3. Patch 적용

patch 단계에서는 diff 결과를 실제 DOM에 반영한다.  
중요한 점은 전체 DOM을 갈아끼우지 않고, path로 특정 노드를 찾아 필요한 부분만 수정한다는 것이다.

- 텍스트만 바뀌면 텍스트만 수정
- 속성만 바뀌면 속성만 수정
- 자식이 추가/삭제되면 해당 위치만 반영
- 타입이 달라지면 해당 노드만 교체

즉, "변한 부분만 실제 DOM에 최소 단위로 반영"하는 것이 patch의 핵심이다.

### 4. History와 Undo / Redo

각 상태는 snapshot으로 저장한다.  
undo는 index를 뒤로 옮기고, redo는 앞으로 옮긴다.  
undo 이후 새 상태를 push하면 기존 future entry는 제거한다.

이 구조를 사용하면 patch 결과뿐 아니라 전체 상태 흐름도 안정적으로 되돌릴 수 있다.

## 동작 흐름

| 단계 | 설명 |
|---|---|
| 초기 로드 | real DOM을 읽어 첫 VNode를 만들고 history를 시작한다 |
| Patch | 이전 VNode와 새 VNode를 비교해 patch를 만들고 real DOM에 반영한다 |
| Undo / Redo | snapshot index를 이동한 뒤 현재 상태를 다시 렌더링한다 |

## 테스트를 어떻게 했는가

<div align="center">

![Contract](https://img.shields.io/badge/Test-Contract-2563eb?style=flat-square)
![Unit](https://img.shields.io/badge/Test-Unit-16a34a?style=flat-square)
![Integration](https://img.shields.io/badge/Test-Integration-f59e0b?style=flat-square)
![Concurrency](https://img.shields.io/badge/Test-Concurrency_like-db2777?style=flat-square)
![Load](https://img.shields.io/badge/Test-Load-7c3aed?style=flat-square)

</div>

이 프로젝트는 테스트를 단순 확인용이 아니라 "품질 검증 기준"으로 사용했다. 특히 `AGENTS.md`에서 강조한 contract test와 edge case 대응을 실제 테스트 구조에 반영했다.

테스트는 크게 네 층으로 나눴다.

- Contract Test  
  공통 포맷과 계약이 깨지지 않는지 검증
- Unit Test  
  각 모듈의 책임을 직접 검증
- Integration Test  
  patch, undo, redo까지 전체 흐름이 연결되는지 검증
- Concurrency-like / Load Test  
  빠른 연속 실행, 반복 churn, 큰 입력에서도 결과가 안정적인지 검증

또한 외부 의존성 없이 실행되도록 경량 테스트 러너와 fake DOM 환경을 직접 구성했다.

## 대표 테스트 케이스

### 테스트 관점

| 관점 | 무엇을 확인했는가 |
|---|---|
| 일반 동작 | 정상 입력에서 변환, diff, patch, history가 기대대로 이어지는가 |
| 극단 케이스 | 빈 값, 잘못된 입력, 깊은 path, root 교체 같은 경계 상황에서도 안전한가 |
| 반복 실행 | 빠른 연속 클릭, 반복 patch, churn 상황에서도 결과가 꼬이지 않는가 |
| 큰 입력 | 큰 트리와 중첩 구조에서도 diff / patch 정합성이 유지되는가 |

### 일반 케이스

- DOM -> VNode -> DOM 변환이 정상적으로 왕복되는지
- text 변경 시 `TEXT` patch가 정확히 생성되는지
- prop 변경 시 `SET_PROP`, prop 제거 시 `REMOVE_PROP`이 나오는지
- child 추가/삭제 시 index 기반 path가 올바르게 계산되는지
- patch 적용 후 real DOM이 target DOM과 동일한지
- undo / redo 시 history index와 현재 상태가 일치하는지
- patch 버튼 실행 후 real DOM, test DOM, patch log가 함께 갱신되는지

### 극단적 / edge 케이스

- 빈 문자열 텍스트와 공백 텍스트가 사라지지 않는지
- comment node, null 입력, 지원하지 않는 노드 입력을 안전하게 처리하는지
- event prop / event-like attribute를 diff와 DOM 반영에서 무시하는지
- 잘못된 path나 비정상 payload가 들어와도 DOM이 깨지지 않는지
- root 노드 교체가 wrapper를 건드리지 않고 안전하게 이뤄지는지
- 매우 깊은 path에서도 올바른 노드를 찾을 수 있는지
- undo 후 새 상태를 push했을 때 future history가 잘리는지
- 외부에서 snapshot을 바꿔도 history 내부 상태가 오염되지 않는지
- 빠르게 연속 클릭해도 핸들러 순서가 꼬이지 않는지
- 반복적인 patch / render / history churn 이후에도 최종 상태가 틀어지지 않는지
- 큰 중첩 트리에서도 diff와 patch 결과가 정합성을 유지하는지

이 테스트들은 단순한 happy path뿐 아니라, 실제 구현이 흔들리기 쉬운 경계 조건을 최대한 드러내는 방향으로 구성했다.

## 품질 검증 포인트

> [!IMPORTANT]
> 이 프로젝트의 테스트는 "된다"를 확인하는 수준이 아니라, "깨지기 쉬운 상황에서도 구조가 안전한가"를 검증하는 데 초점을 맞췄다.

우리가 코드 품질을 확인할 때 본 기준은 아래와 같다.

- 문서 계약을 끝까지 유지했는가
- core 로직이 UI에 중복되지 않는가
- path, root, history 같은 취약 지점을 안전하게 다루는가
- 부분 업데이트가 실제로 부분 업데이트로 동작하는가
- undo / redo와 새 patch 조합에서도 상태가 꼬이지 않는가
- 반복 실행이나 큰 입력에서도 결과가 결정적으로 유지되는가

## 실행 방법

| 작업 | 명령어 |
|---|---|
| 테스트 실행 | `npm test` |
| 정적 서버 실행 | `python -m http.server 4173` |

브라우저에서 `http://127.0.0.1:4173` 으로 접속하면 playground를 확인할 수 있다.

## 폴더 구조

```text
src/
  core/
    types.js
    domToVNode.js
    vNodeToDOM.js
    render.js
    diff.js
    patch.js
    history.js
  ui/
    app.js
    bindings.js
    fixtures.js

tests/
  contracts/
  unit/
  integration/
  fixtures/
  helpers/
```

## 참고 문서

- `AGENTS.md`
- `docs/development-plan.md`
- `docs/commit-convention.md`
- `docs/vnode-spec-v1.0.md`
- `docs/text-node-rules-v1.0.md`

---

<div align="center">

**Contract First · Diff Predictably · Patch Minimally · Test Aggressively**

</div>
