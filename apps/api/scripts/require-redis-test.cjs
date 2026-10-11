if (!process.env.REDIS_TEST_URL) {
  console.error('Set REDIS_TEST_URL to an explicit test Redis connection. Application REDIS_URL is never used.');
  process.exitCode = 1;
} else {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, ['--experimental-vm-modules', 'scripts/run-jest.cjs', '--config', './test/jest-e2e.json', '--runInBand', 'otp-redis'], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}
