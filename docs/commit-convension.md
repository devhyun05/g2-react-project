# G2 Commit Convention

이 문서는 팀의 커밋 메시지 형식과 커밋 단위 규칙만 정의한다.

## 1) Commit Message Format

기본 형식:

```text
<type>: <summary>
```

예시:

- `feat: implement domToVNode converter`
- `fix: handle null text node in renderer`
- `test: add diff edge case for child removal`
- `docs: clarify vnode text node spec`
- `refactor: split patch applier by operation type`
- `ci: add smoke test workflow`
- `chore: update eslint config`

## 2) Allowed Types

- `feat`: 기능 추가
- `fix`: 버그 수정
- `test`: 테스트 추가 또는 수정
- `docs`: 문서 변경
- `refactor`: 동작 변경 없는 구조 개선
- `ci`: CI/CD 설정 변경
- `chore`: 빌드, 도구, 설정 정리

## 3) Writing Rules

- 요약(`summary`)은 짧고 구체적으로 작성한다.
- 한 커밋에는 한 가지 의도만 담는다.
- AI가 생성한 코드라도 의미 단위로 쪼개서 커밋한다.
- 문서 규칙이나 테스트 계약을 바꿨다면 관련 코드와 함께 설명 가능한 단위로 묶는다.
- 대량 포맷 변경만 있는 커밋은 기능 변경 커밋과 분리한다.

## 4) Scope Rules For This Project

- VDOM 변환/렌더 변경은 가능한 한 별도 커밋으로 분리한다.
- Diff 알고리즘 변경은 입력/기대 patch 테스트와 같은 커밋에 포함한다.
- Patch 적용/History 변경은 `undo/redo` 검증 코드와 함께 커밋한다.
- UI 변경은 기능 로직 커밋과 분리하고, 이벤트 연결 변경 시 테스트 체크 내용을 커밋 메시지에 명시한다.

## 5) Good / Bad Examples

좋은 예:

- `feat: add vnodeToDOM for element and text nodes`
- `fix: preserve input value when applying props patch`
- `test: cover replace patch on root path`

나쁜 예:

- `feat: update code`
- `fix: bug fix`
- `chore: many changes`

## 6) Collaboration Principles

- 기본 브랜치 흐름은 `개인 브랜치 -> dev PR -> dev -> main PR` 순서를 따른다.
- `main`은 항상 데모 가능한 상태를 유지한다.
- `dev`는 팀 통합 브랜치로 사용한다.
- 작업은 기능 브랜치에서 진행하고 PR로만 합친다.
- 각 작업자는 자신의 브랜치에 push 한 뒤 `dev` 브랜치로 PR을 올린다.
- PR 생성/갱신 전에는 `origin/dev`를 fetch 하고 `rebase`(또는 `pull --rebase`)로 최신 상태를 반영한다.
- 팀 통합 후에는 `dev`에서 `main`으로 별도 PR을 올린다.
- PR 전 테스트는 로컬 기준으로 먼저 검증한다.
- 테스트는 자동 테스트와 스모크 테스트를 분리해서 관리한다.
- 문서, 테스트, 코드 변경은 가능한 한 같은 PR에서 함께 정리한다.
