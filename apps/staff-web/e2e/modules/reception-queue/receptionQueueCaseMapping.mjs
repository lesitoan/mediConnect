const entries = [
  ["UC07-TK-01", "RECEPTIONIST", "reception", null, false],
  ["UC07-TK-02", "RECEPTIONIST", "reception", null, false],
  ["UC07-TK-03", "RECEPTIONIST", "reception", null, false],
  ["UC07-TK-04", "RECEPTIONIST", "queue", "FULL", false],
  ["UC07-TK-05", "RECEPTIONIST", "reception", null, false],
  ["UC07-TK-06", "RECEPTIONIST", "reception", null, false],
  ["UC07-TK-07", "RECEPTIONIST", "reception", null, false],
  ["UC07-TK-08", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-03", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-09", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-10", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-11", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-12", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-16", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-17", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-18", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-19", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-20", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-30", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-31", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-32", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-02", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-03", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-04", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-05", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-06", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-07", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-08", "RECEPTIONIST", "queue", "FULL", false],
  ["UC07-TN-09", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-10", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-11", "RECEPTIONIST", "queue", "FULL", false],
  ["UC07-TN-12", "RECEPTIONIST", "queue", "FULL", false],
  ["UC07-TN-19", "RECEPTIONIST", "reception", null, false],
  ["UC07-HC-01", "RECEPTIONIST", "queue", "FULL", false],
  ["UC07-HC-04", "RECEPTIONIST", "queue", "FULL", false],
  ["UC07-HC-05", "RECEPTIONIST", "queue", "FULL", false],
  ["UC07-HC-06", "RECEPTIONIST", "queue", "FULL", false],
  ["UC07-BQ-12", "DOCTOR", "queue", "WAITING", false],
  ["UC07-BQ-13", "DOCTOR", "queue", "IN_CONSULTATION", false],
  ["UC07-BQ-14", "DOCTOR", "queue", "CALL_NEXT", true],
  ["UC07-BQ-15", "DOCTOR", "queue", "EMPTY", false],
  ["UC07-TN-01", "RECEPTIONIST", "reception", null, true],
  ["UC07-TN-13", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-14", "RECEPTIONIST", "reception", null, false],
  ["UC07-TN-15", "RECEPTIONIST", "reception", null, true],
  ["UC07-TN-20", "RECEPTIONIST", "reception", null, false],
  ["UC07-WI-01", "RECEPTIONIST", "reception", null, true],
  ["UC07-WI-02", "RECEPTIONIST", "reception", null, true],
  ["UC07-HC-07", "RECEPTIONIST", "queue", "FULL", false],
  ["UC07-BQ-16", "DOCTOR", "queue", "START", true],
  ["UC07-BQ-17", "DOCTOR", "queue", "IN_CONSULTATION", true],
  ["UC07-BQ-18", "DOCTOR", "queue", "SKIP_READY", true],
  ["UC07-BQ-19", "DOCTOR", "queue", "RESTORE", true],
  ["UC07-BQ-20", "DOCTOR", "queue", "SKIP_WAIT", false],
  ["UC07-BQ-21", "DOCTOR", "queue", "IN_CONSULTATION_INCOMPLETE", false],
  ["UC07-BQ-22", "DOCTOR", "queue", "WAITING", false],
  ["UC07-BQ-23", "DOCTOR", "queue", "WAITING", false],
];

const ACTOR_ACCOUNTS = {
  DOCTOR: { email: "doctor01@example.invalid", doctorCode: "STAFF-DEMO-01" },
  RECEPTIONIST: { email: "receptionist01@example.invalid", doctorCode: null },
};

const FIXTURE_METADATA = {
  reception: {
    scenario: "RECEPTION",
    stateToSeed:
      "REC-DEMO patients with current-day scheduled, checked-in, cancelled, completed, and pending-resolution appointments, plus future appointments.",
    doctorCodes: ["SEED-GEN-01", "SEED-GEN-02", "SEED-SUR-01"],
    slotRequirement:
      "Available 30-minute slots in published schedules for the prior, current, and next clinic dates.",
  },
  queue: {
    scenario: "QUEUE",
    doctorCodes: ["SEED-GEN-01", "SEED-GEN-02", "SEED-SUR-01"],
    doctorCodeAliases: ["BS01"],
    slotRequirement:
      "Available 30-minute slots in published schedules; the FULL fixture also uses a prior-day slot for its past appointment.",
  },
};

const QUEUE_SCENARIO_METADATA = {
  FULL: "Waiting, called, skipped, in-consultation, completed, no-show, paused, cancelled, pending-resolution, and past/lab visits.",
  WAITING: "One WAITING visit owned by STAFF-DEMO-01.",
  IN_CONSULTATION: "One IN_CONSULTATION visit with saved clinical data.",
  CALL_NEXT: "One WAITING visit owned by STAFF-DEMO-01.",
  EMPTY: "No queue visits for STAFF-DEMO-01.",
  START: "One CALLED visit called 30 seconds earlier.",
  SKIP_READY: "One CALLED visit called 181 seconds earlier and one WAITING visit.",
  SKIP_WAIT: "One CALLED visit called 60 seconds earlier.",
  RESTORE: "One SKIPPED visit owned by STAFF-DEMO-01.",
  IN_CONSULTATION_INCOMPLETE:
    "One IN_CONSULTATION visit without clinical notes or diagnosis.",
};

export const RECEPTION_QUEUE_CASE_MAPPING = new Map(
  entries.map(([id, role, fixture, queueScenario, isMutating]) => [
    id,
    {
      id,
      role,
      fixtureNames: [fixture],
      queueScenario,
      isMutating,
      testLayer: "UI",
    },
  ]),
);

export function getReceptionQueueCase(testCaseId) {
  const caseId = testCaseId.trim().toUpperCase();
  const testCase = RECEPTION_QUEUE_CASE_MAPPING.get(caseId);
  if (!testCase) throw new Error(`Unsupported reception queue testcase: ${testCaseId}`);
  const fixture = FIXTURE_METADATA[testCase.fixtureNames[0]];
  return {
    ...testCase,
    scenario: testCase.queueScenario ?? fixture.scenario,
    stateToSeed: testCase.queueScenario
      ? QUEUE_SCENARIO_METADATA[testCase.queueScenario]
      : fixture.stateToSeed,
    slotRequirement: fixture.slotRequirement,
    doctorCodes:
      testCase.fixtureNames[0] === "queue" && testCase.queueScenario !== "FULL"
        ? ["STAFF-DEMO-01"]
        : fixture.doctorCodes,
    doctorCodeAliases:
      testCase.fixtureNames[0] === "queue" && testCase.queueScenario === "FULL"
        ? fixture.doctorCodeAliases
        : [],
    actorAccount: ACTOR_ACCOUNTS[testCase.role],
  };
}

export function validateReceptionQueueTestCases(testCases, { requireComplete = false } = {}) {
  const seenIds = new Set();
  for (const testCase of testCases) {
    const mapping = getReceptionQueueCase(testCase.id);
    const caseId = testCase.id.trim().toUpperCase();
    if (seenIds.has(caseId)) throw new Error(`Duplicate reception queue testcase: ${caseId}`);
    seenIds.add(caseId);

    const fixtureLine = testCase.preCondition.match(/^Fixture:\s*(.+)$/im)?.[1];
    const fixtureNames = fixtureLine
      ? fixtureLine.split(",").map((fixture) => fixture.trim().toLowerCase())
      : [];
    if (
      fixtureNames.length !== mapping.fixtureNames.length ||
      fixtureNames.some((fixture, index) => fixture !== mapping.fixtureNames[index])
    ) {
      throw new Error(
        `Testcase ${caseId} fixture does not match its mapping (${mapping.fixtureNames.join(", ")}).`,
      );
    }

    const queueScenario = testCase.preCondition
      .match(/^Queue scenario:\s*([A-Z_]+)\s*$/im)?.[1]
      ?.toUpperCase() ?? null;
    if (queueScenario !== mapping.queueScenario) {
      throw new Error(
        `Testcase ${caseId} queue scenario does not match its mapping (${mapping.queueScenario ?? "none"}).`,
      );
    }
  }

  if (requireComplete) {
    const missingIds = [...RECEPTION_QUEUE_CASE_MAPPING.keys()].filter((id) => !seenIds.has(id));
    if (missingIds.length) {
      throw new Error(`Reception queue workbook is missing mapped cases: ${missingIds.join(", ")}`);
    }
  }
}
