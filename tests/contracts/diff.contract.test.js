import assert from "node:assert/strict";
import { test } from "../helpers/testHarness.js";

import { diff } from "../../src/core/diff.js";
import { basicTree, updatedTree } from "../fixtures/sampleTrees.js";

test("diff contract returns only documented patch kinds with agreed fields", () => {
  const patches = diff(basicTree, updatedTree);
  const allowedKinds = new Set([
    "CREATE",
    "REMOVE",
    "REPLACE",
    "TEXT",
    "SET_PROP",
    "REMOVE_PROP",
  ]);

  assert.ok(patches.length > 0);

  for (const patch of patches) {
    assert.equal(typeof patch.kind, "string");
    assert.ok(allowedKinds.has(patch.kind));
    assert.ok(Array.isArray(patch.path));

    if (patch.kind === "CREATE" || patch.kind === "REPLACE") {
      assert.equal(typeof patch.node, "object");
    }

    if (patch.kind === "TEXT") {
      assert.equal(typeof patch.text, "string");
    }

    if (patch.kind === "SET_PROP") {
      assert.equal(typeof patch.key, "string");
      assert.equal(typeof patch.value, "string");
    }

    if (patch.kind === "REMOVE_PROP") {
      assert.equal(typeof patch.key, "string");
    }
  }
});
