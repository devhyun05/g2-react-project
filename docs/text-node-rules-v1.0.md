# Text Node 처리 규칙 문서 v1.0

VNode 스펙 문서와 함께 사용하는 팀 공통 규칙

## 목적

텍스트를 어떤 방식으로 VNode 안에 표현하고 정규화할지 팀 전체가 동일한 기준을 사용하도록 정의한다.

## 1. 기본 원칙

- 모든 텍스트는 `children` 안에 문자열로 직접 넣지 않고 `TEXT` VNode로 표현한다.
- 텍스트 노드도 일반 엘리먼트 노드와 동일하게 `{ type, props, children }` 구조를 따른다.

## 2. TEXT VNode 표준 형태

```js
{
  type: "TEXT",
  props: {
    nodeValue: string
  },
  children: []
}
```

규칙:

- `type`은 반드시 `"TEXT"`
- `props.nodeValue`는 반드시 문자열
- `children`은 항상 빈 배열 `[]`

## 3. 입력값 처리 규칙

`children`에 들어올 수 있는 값들은 아래 기준으로 정규화한다.

### 3.1 문자열 (string)

문자열은 TEXT VNode로 변환한다.

- 입력: `"hello"`
- 결과: `{ type: "TEXT", props: { nodeValue: "hello" }, children: [] }`

### 3.2 숫자 (number)

숫자는 문자열로 변환한 뒤 TEXT VNode로 처리한다.

- 입력: `123`
- 결과: `{ type: "TEXT", props: { nodeValue: "123" }, children: [] }`

### 3.3 불리언 (`true`, `false`)

불리언 값은 렌더링하지 않는다. 즉, `children`에서 제거한다.

- 입력: `["hello", false, "world", true]`
- 결과: `[TEXT("hello"), TEXT("world")]`

### 3.4 `null`, `undefined`

`null`과 `undefined`는 렌더링하지 않는다. 즉, `children`에서 제거한다.

- 입력: `["A", null, undefined, "B"]`
- 결과: `[TEXT("A"), TEXT("B")]`

### 3.5 배열 (Array)

중첩된 배열은 허용하되, 최종적으로는 flatten 해서 처리한다.

- 입력: `["a", ["b", ["c"]]]`
- 결과: `[TEXT("a"), TEXT("b"), TEXT("c")]`

### 3.6 이미 VNode인 값

이미 VNode 형태인 값은 그대로 유지한다.

- 입력: `{ type: "span", props: {}, children: [] }`
- 결과: 그대로 사용

## 4. 공백 처리 규칙

공백 문자열과 빈 문자열도 원칙적으로 보존한다.

### 4.1 공백 문자열 `" "` 유지

공백 문자열은 제거하지 않고 TEXT VNode로 유지한다.

### 4.2 빈 문자열 `""` 유지

빈 문자열도 TEXT VNode로 변환하여 유지한다.

## 5. 공식 합의안

- `string` -> TEXT VNode로 변환
- `number` -> 문자열 변환 후 TEXT VNode로 변환
- `null / undefined / true / false` -> 렌더링하지 않고 제거
- `nested array children` -> flatten
- `" " / ""` -> 보존
- TEXT VNode의 `children` -> 항상 `[]`

## 6. 팀 공유용 짧은 버전

```js
// Text VNode
{
  type: "TEXT",
  props: { nodeValue: string },
  children: []
}
```

- `string` -> TEXT VNode
- `number` -> `String(number)` -> TEXT VNode
- `null / undefined / true / false` -> 제거
- `nested children array` -> flatten
- `" " / ""` -> 유지
- TEXT VNode의 `children`은 항상 `[]`
