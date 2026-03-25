const TESTS = [];

export function test(name, fn) {
  TESTS.push({ name, fn });
}

export async function run() {
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of TESTS) {
    try {
      await fn();
      passed += 1;
      console.log(`PASS ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${name}`);
      console.error(error?.stack ?? error);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}
