import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearStaffSession,
  createBrowser,
  loginAsStaffRole,
  waitForLocalServices,
} from "./shared/browser.mjs";
import { readTestCases } from "./shared/excelCases.mjs";
import { writeTestReport } from "./shared/excelReport.mjs";
import {
  validateReceptionQueueTestCase,
  runReceptionQueueScenario,
} from "./modules/reception-queue/receptionQueueScenarios.mjs";
import {
  getReceptionQueueCase,
  validateReceptionQueueTestCases,
} from "./modules/reception-queue/receptionQueueCaseMapping.mjs";

const SCRIPT_DIRECTORY = fileURLToPath(new URL(".", import.meta.url));
const INPUT_FILE = resolve(
  SCRIPT_DIRECTORY,
  process.env.E2E_INPUT_FILE ?? "test-cases/reception-queue.xlsx",
);
const OUTPUT_FILE = resolve(
  SCRIPT_DIRECTORY,
  process.env.E2E_OUTPUT_FILE ?? "results/reception-queue-results.xlsx",
);
const STAFF_WEB_URL = process.env.STAFF_WEB_URL ?? "http://localhost:3001";
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";
const API_DIRECTORY = resolve(SCRIPT_DIRECTORY, "../../../apps/api");
const E2E_NOW =
  process.env.E2E_NOW ?? "2026-11-10T08:30:00+07:00";
const E2E_NOW_PATTERN =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?\+07:00$/;

function validateE2EClock() {
  if (!E2E_NOW_PATTERN.test(E2E_NOW)) {
    throw new Error(
      "E2E_NOW must be an ISO datetime with the +07:00 offset.",
    );
  }
  const timestamp = Date.parse(E2E_NOW);
  if (!Number.isFinite(timestamp)) {
    throw new Error("E2E_NOW must be a valid ISO datetime.");
  }
}

function validateLocalUrl(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid local URL.`);
  }
  if (
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)
  ) {
    throw new Error(`${name} must point to a local service.`);
  }
}

function parseOptions(args) {
  const options = {
    ids: process.env.E2E_TEST_IDS,
  };
  for (const argument of args) {
    if (argument === "--help") {
      console.log(
        "Usage: node e2e/runReceptionTests.mjs [--ids=UC07-TK-01,...] [--auto-seed]",
      );
      return { ...options, showHelp: true };
    }
    if (argument === "--auto-seed") {
      continue;
    }
    const [key, value] = argument.split("=", 2);
    if (key === "--ids" && value) {
      options.ids = value;
      continue;
    }
    throw new Error(`Unsupported runner option "${argument}".`);
  }
  return options;
}

function filterTestCases(testCases, options) {
  const ids = options.ids
    ? new Set(options.ids.split(",").map((id) => id.trim().toUpperCase()))
    : null;
  const selected = testCases.filter((testCase) => {
    if (ids && !ids.has(testCase.id.toUpperCase())) return false;
    return true;
  });
  if (selected.length === 0) {
    throw new Error("No testcase matched the selected ID filter.");
  }
  return selected;
}

function getBlockedReason(testCase) {
  return testCase.preCondition.match(/^Automation:\s*BLOCKED:\s*(.+)$/im)?.[1];
}

function getFixtureConfiguration(testCase) {
  const { fixtureNames, queueScenario } = getReceptionQueueCase(testCase.id);
  return { fixtureNames, queueScenario };
}

function runFixtureSeeds(
  { fixtureNames, queueScenario },
  { cleanup = false } = {},
) {
  const scripts = {
    reception: "prisma:seed:reception-demo",
    queue: "prisma:seed:queue-demo",
  };
  const command = process.platform === "win32" ? "npm.cmd" : "npm";

  for (const fixtureName of fixtureNames) {
    const script = scripts[fixtureName];
    if (!script) {
      throw new Error(`Unsupported fixture "${fixtureName}".`);
    }
    const scriptArguments = [];
    if (cleanup) scriptArguments.push("--cleanup");
    if (fixtureName === "queue" && !cleanup && queueScenario) {
      scriptArguments.push(`--scenario=${queueScenario}`);
    }
    const result = spawnSync(
      command,
      [
        "run",
        script,
        ...(scriptArguments.length ? ["--", ...scriptArguments] : []),
      ],
      {
        cwd: API_DIRECTORY,
        encoding: "utf8",
        shell: process.platform === "win32",
        env: { ...process.env, E2E_NOW },
      },
    );
    if (result.error || result.status !== 0) {
      const output = [result.stdout, result.stderr]
        .filter(Boolean)
        .join("\n")
        .trim();
      throw new Error(
        `Could not prepare ${fixtureName} fixture.${output ? `\n${output}` : ""}`,
        { cause: result.error },
      );
    }
  }
}

function normalizeError(error) {
  return error instanceof Error ? error.message : "Unknown automation error.";
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.showHelp) return;

  const workbookTestCases = await readTestCases(INPUT_FILE);
  validateReceptionQueueTestCases(workbookTestCases, { requireComplete: true });
  const testCases = filterTestCases(workbookTestCases, options);
  const hasAutomatedCases = testCases.some(
    (testCase) => !getBlockedReason(testCase),
  );
  if (hasAutomatedCases) {
    validateE2EClock();
    validateLocalUrl(STAFF_WEB_URL, "STAFF_WEB_URL");
    validateLocalUrl(API_BASE_URL, "API_BASE_URL");
  }
  for (const testCase of testCases) {
    if (getBlockedReason(testCase)) continue;
    const role = validateReceptionQueueTestCase(testCase);
    const fixtureConfiguration = getFixtureConfiguration(testCase);
    if (fixtureConfiguration.fixtureNames.length === 0) {
      throw new Error(
        `Testcase ${testCase.id} must declare a Fixture in pre-condition.`,
      );
    }
    if (role === "PATIENT") {
      throw new Error(
        `Testcase ${testCase.id} requires a patient login that is not configured in the Selenium runner.`,
      );
    }
    if (
      role === "RECEPTIONIST" &&
      (!process.env.E2E_RECEPTION_EMAIL ||
        !process.env.E2E_RECEPTION_PASSWORD)
    ) {
      throw new Error(
        "Set E2E_RECEPTION_EMAIL and E2E_RECEPTION_PASSWORD for the local test account.",
      );
    }
    if (
      role === "DOCTOR" &&
      (!process.env.E2E_DOCTOR_EMAIL || !process.env.E2E_DOCTOR_PASSWORD)
    ) {
      throw new Error(
        "Set E2E_DOCTOR_EMAIL and E2E_DOCTOR_PASSWORD for the local test account.",
      );
    }
  }
  if (hasAutomatedCases) {
    await waitForLocalServices({
      staffWebUrl: STAFF_WEB_URL,
      apiBaseUrl: API_BASE_URL,
    });
  }

  const results = [];
  const usedFixtures = new Set();
  const cleanupErrors = [];
  let driver = null;
  let currentRole = null;

  try {
    for (const testCase of testCases) {
      const blocker = getBlockedReason(testCase);
      if (blocker) {
        results.push({
          testCase,
          actualResult: `NOT RUN: ${blocker}`,
          status: "BLOCKED",
        });
        console.log(`${testCase.id}: BLOCKED - ${blocker}`);
        continue;
      }

      const fixtureConfiguration = getFixtureConfiguration(testCase);
      for (const fixtureName of fixtureConfiguration.fixtureNames)
        usedFixtures.add(fixtureName);
      let actualResult = "";
      let status = "PASS";

      try {
        runFixtureSeeds(fixtureConfiguration);
        if (!driver) driver = await createBrowser(E2E_NOW);

        const role = validateReceptionQueueTestCase(testCase);
        if (role === "ANONYMOUS") {
          await clearStaffSession(driver, STAFF_WEB_URL);
          currentRole = role;
        } else if (role !== currentRole) {
          await loginAsStaffRole(driver, STAFF_WEB_URL, role);
          currentRole = role;
        }
        actualResult = await runReceptionQueueScenario({
          driver,
          baseUrl: STAFF_WEB_URL,
          testCase,
        });
      } catch (error) {
        console.error(`[${testCase.id}]`, error);
        actualResult = `FAILED: ${normalizeError(error)}`;
        status = "FAILED";
      } finally {
        if (getReceptionQueueCase(testCase.id).isMutating) {
          try {
            runFixtureSeeds(fixtureConfiguration, { cleanup: true });
          } catch (error) {
            const cleanupError = normalizeError(error);
            actualResult = [
              actualResult,
              `Fixture cleanup failed: ${cleanupError}`,
            ]
              .filter(Boolean)
              .join(" ");
            status = "FAILED";
          }
        }
      }

      if (status === "PASS") actualResult = `PASS: ${actualResult}`;
      results.push({ testCase, actualResult, status });
      console.log(`${testCase.id}: ${status}`);
    }
  } finally {
    if (driver) {
      try {
        await driver.quit();
      } catch (error) {
        cleanupErrors.push(`Chrome: ${normalizeError(error)}`);
      }
    }
    for (const fixtureName of usedFixtures) {
      try {
        runFixtureSeeds({ fixtureNames: [fixtureName] }, { cleanup: true });
      } catch (error) {
        cleanupErrors.push(`${fixtureName}: ${normalizeError(error)}`);
      }
    }
  }

  if (cleanupErrors.length > 0) {
    const cleanupMessage = `Final fixture cleanup failed: ${cleanupErrors.join("; ")}`;
    const lastResult = results.at(-1);
    if (!lastResult) throw new Error(cleanupMessage);
    lastResult.actualResult = `${lastResult.actualResult} ${cleanupMessage}`.trim();
    lastResult.status = "FAILED";
  }

  const summary = await writeTestReport(OUTPUT_FILE, results);
  console.log(
    `E2E completed: ${summary.passed} PASS, ${summary.failed} FAILED, ${summary.blocked} BLOCKED, ${summary.total} total.`,
  );
  console.log(`Report: ${OUTPUT_FILE}`);

  if (summary.failed > 0 || summary.blocked > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Could not run reception E2E tests.",
  );
  process.exitCode = 1;
});
