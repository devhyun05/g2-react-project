# VNode 스펙 문서 v1.0

팀 공통 Virtual DOM 자료구조 규약

## 목적

모든 팀원이 동일한 VNode shape를 기준으로 DOM <-> VDOM 변환, diff, patch, 테스트를 진행하기 위한 공통 규약이다.

## 1. 기본 구조

모든 VNode는 `type`, `props`, `children` 세 필드를 가진다.  
텍스트 노드도 동일한 shape를 사용한다.

```js
{
  type: string,
  props: Object,
  children: VNode[]
}
```

## 2. 필드 정의

- `type`: HTML 태그명 문자열 또는 `"TEXT"`
- `props`: 속성 객체. 값이 없어도 반드시 빈 객체 `{}`
- `children`: 자식 노드 배열. 자식이 없으면 빈 배열

## 3. TEXT 노드 규칙

- 텍스트는 문자열로 직접 두지 않고 `type: "TEXT"` 형태의 VNode로 표현한다.
- TEXT 노드는 `props.nodeValue`에 실제 문자열을 저장한다.
- TEXT 노드의 `children`은 항상 빈 배열이다.

```js
{
  type: "TEXT",
  props: {
    nodeValue: "hello"
  },
  children: []
}
```

## 4. 공통 규칙

- 모든 노드는 `type`, `props`, `children`을 반드시 포함한다.
- `children`은 항상 배열이어야 한다.
- 문자열 텍스트는 직접 `children`에 넣지 않는다.
- `class`는 `className`으로 통일한다.
- 이벤트는 `onClick` 같은 camelCase 형태로 `props`에 저장한다.

## 5. 비허용 형태

- `children: ["hello"]` -> 불가
- `children: { ... }` -> 불가
- `props` 생략 -> 불가
- `children` 생략 -> 불가

## 6. v1.0 비지원 범위

- 함수형 컴포넌트 / 클래스 컴포넌트
- Fragment / key / ref
- portal / hook / 특수 최적화 필드

## 7. 팀 최종 합의 문장

우리 팀의 VNode는 `{ type, props, children }` 구조를 사용한다. 텍스트도 `"TEXT"` 타입의 VNode로 표현하며, `props`는 항상 객체, `children`은 항상 배열로 유지한다. `class`는 `className`으로 통일하고, 이벤트는 `onClick` 형태로 `props`에 저장한다.
