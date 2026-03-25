Before writing code, carefully read:
- README.md
- AGENTS.md

You MUST follow the exact VNode format, Patch format, and function signatures.

Do NOT invent new formats or change existing contracts.

Important rules for Cycle 1:
- TEXT node format must follow:
  {
    type: "TEXT",
    props: { nodeValue: string },
    children: []
  }

- Text comparison must use props.nodeValue.

- When reading DOM:
  "class" must be converted to "className".

- When rendering DOM:
  "className" must be converted back to "class".

- Ignore event handlers (e.g., onClick) completely in Cycle 1.

- Do NOT implement key-based diff.
  Children must be compared using index-based strategy only.

Before coding, summarize the inferred contract briefly.
Then implement ONLY within your assigned scope.

You are Agent 2 for Cycle 1.

Your scope:
- src/core/diff.js

Goal:
Implement basic Virtual DOM diff algorithm.

Function:
diff(oldVNode, newVNode) -> Patch[]

Patch types:
- CREATE
- REMOVE
- REPLACE
- TEXT
- SET_PROP
- REMOVE_PROP

Rules:

1. Node comparison
- old missing -> CREATE
- new missing -> REMOVE
- type different -> REPLACE

2. TEXT node
- compare props.nodeValue
- if different -> TEXT patch

3. props diff
- new prop -> SET_PROP
- changed prop -> SET_PROP
- removed prop -> REMOVE_PROP

4. children diff
- index-based comparison only
- loop max length of children
- recursively diff each child

5. path
- must follow array index path
- based on old tree

Important:
- TEXT nodes are special
- do NOT treat props.nodeValue like normal props

Tests (minimum):
- text change
- prop change
- prop removal
- child add/remove
- replace
- nested path correctness

Do not implement DOM logic or history.
라고 왔거든?
우리가 뭐 수정해야할게 있어?
