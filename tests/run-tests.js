import { run } from "./helpers/testHarness.js";

await import("./contracts/vnode.contract.test.js");
await import("./contracts/diff.contract.test.js");
await import("./contracts/patch.contract.test.js");
await import("./contracts/history.contract.test.js");
await import("./unit/domToVNode.test.js");
await import("./unit/vNodeToDOM.test.js");
await import("./unit/render.test.js");
await import("./unit/diff.test.js");
await import("./unit/patch.test.js");
await import("./unit/history.test.js");
await import("./unit/bindings.test.js");
await import("./unit/concurrency.test.js");
await import("./integration/app.integration.test.js");

await run();
