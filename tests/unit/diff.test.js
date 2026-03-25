import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import { diff } from "../../src/core/diff.js";
import {
  createIdentityState,
  reconcileVNodeIdentity,
  seedVNodeIdentity,
} from "../../src/core/identity.js";
import {
  basicTree,
  deepTree,
  replacedRootTree,
  updatedTree,
} from "../fixtures/sampleTrees.js";

test("diff emits text, prop, and create patches with stable paths", () => {
  const patches = diff(basicTree, updatedTree);

  assert.deepEqual(patches, [
    { kind: "SET_PROP", path: [], key: "className", value: "card featured" },
    { kind: "TEXT", path: [1, 0], text: "Soybean paste stew" },
    {
      kind: "CREATE",
      path: [2, 2],
      node: {
        type: "li",
        props: {},
        children: [
          {
            type: "TEXT",
            props: { nodeValue: "Seasonal fruit" },
            children: [],
          },
        ],
      },
    },
  ]);
});

test("diff replaces the root when node types differ", () => {
  const patches = diff(basicTree, replacedRootTree);

  assert.deepEqual(patches, [
    { kind: "REPLACE", path: [], node: replacedRootTree },
  ]);
});

test("diff handles deep nested paths and prop removals", () => {
  const nextTree = {
    type: "div",
    props: {},
    children: [
      {
        type: "section",
        props: { className: "outer" },
        children: [
          {
            type: "article",
            props: {},
            children: [
              {
                type: "p",
                props: {},
                children: [
                  {
                    type: "TEXT",
                    props: { nodeValue: "deep value changed" },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const patches = diff(deepTree, nextTree);

  assert.deepEqual(patches, [
    { kind: "REMOVE_PROP", path: [], key: "id" },
    { kind: "REMOVE_PROP", path: [0, 0], key: "data-depth" },
    { kind: "TEXT", path: [0, 0, 0, 0], text: "deep value changed" },
  ]);
});

test("diff ignores event props and emits remove patches for trailing children", () => {
  const oldTree = {
    type: "div",
    props: { onClick: "ignored", className: "panel" },
    children: [
      {
        type: "span",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
      {
        type: "span",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
    ],
  };
  const newTree = {
    type: "div",
    props: { onClick: "changed", className: "panel" },
    children: [
      {
        type: "span",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
    ],
  };

  const patches = diff(oldTree, newTree);

  assert.deepEqual(patches, [{ kind: "REMOVE", path: [1] }]);
});

test("diff infers stable keys from common identity props without an explicit key", () => {
  const oldTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: { "data-id": "alpha" },
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
      {
        type: "li",
        props: { "data-id": "charlie" },
        children: [{ type: "TEXT", props: { nodeValue: "C" }, children: [] }],
      },
    ],
  };
  const newTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: { "data-id": "alpha" },
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
      {
        type: "li",
        props: { "data-id": "bravo" },
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
      {
        type: "li",
        props: { "data-id": "charlie" },
        children: [{ type: "TEXT", props: { nodeValue: "C" }, children: [] }],
      },
    ],
  };

  const patches = diff(oldTree, newTree);

  assert.deepEqual(patches, [
    {
      kind: "CREATE",
      path: [1],
      node: {
        type: "li",
        props: { "data-id": "bravo" },
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
    },
  ]);
});

test("diff reuses stored generated keys for fully unkeyed siblings across middle insertion", () => {
  const identityState = createIdentityState();
  const oldTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "C" }, children: [] }],
      },
    ],
  };
  const newTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "C" }, children: [] }],
      },
    ],
  };

  seedVNodeIdentity(oldTree, identityState);
  reconcileVNodeIdentity(oldTree, newTree, identityState);

  assert.deepEqual(diff(oldTree, newTree), [
    {
      kind: "CREATE",
      path: [1],
      node: {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
    },
  ]);
});

test("diff reuses generated keys for fully unkeyed siblings when inserting in the middle", () => {
  const oldTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "C" }, children: [] }],
      },
    ],
  };
  const newTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "C" }, children: [] }],
      },
    ],
  };

  const patches = diff(oldTree, newTree);

  assert.deepEqual(patches, [
    {
      kind: "CREATE",
      path: [1],
      node: {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
    },
  ]);
});

test("diff keeps same-position unkeyed nodes as updates instead of remove-create churn", () => {
  const oldTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "before" }, children: [] }],
      },
    ],
  };
  const newTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "after" }, children: [] }],
      },
    ],
  };

  const patches = diff(oldTree, newTree);

  assert.deepEqual(patches, [{ kind: "TEXT", path: [0, 0], text: "after" }]);
});

test("diff preserves unkeyed sibling identity on reorder without text rewrite churn", () => {
  const oldTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
    ],
  };
  const newTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
      {
        type: "li",
        props: {},
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
    ],
  };

  const patches = diff(oldTree, newTree);

  assert.equal(patches.some((patch) => patch.kind === "TEXT"), false);
  assert.deepEqual(
    patches.map((patch) => patch.kind),
    ["REMOVE", "CREATE"],
  );
});

test("duplicate sibling keys disable keyed matching and fall back to positional diff", () => {
  const oldTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: { "data-id": "dup" },
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
      {
        type: "li",
        props: { "data-id": "dup" },
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
    ],
  };
  const newTree = {
    type: "ul",
    props: {},
    children: [
      {
        type: "li",
        props: { "data-id": "dup" },
        children: [{ type: "TEXT", props: { nodeValue: "B" }, children: [] }],
      },
      {
        type: "li",
        props: { "data-id": "dup" },
        children: [{ type: "TEXT", props: { nodeValue: "A" }, children: [] }],
      },
    ],
  };

  const patches = diff(oldTree, newTree);

  assert.deepEqual(patches, [
    { kind: "TEXT", path: [0, 0], text: "B" },
    { kind: "TEXT", path: [1, 0], text: "A" },
  ]);
});
