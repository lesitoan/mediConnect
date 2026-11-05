import ExcelJS from "exceljs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const REPORT_HEADERS = [
  "id",
  "description",
  "steps",
  "pre-condition",
  "expected result",
  "actual result",
  "status",
];

export async function writeTestReport(filePath, results) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MediConnect Staff Web E2E";
  workbook.created = new Date();

  const details = workbook.addWorksheet("Test Results");
  details.columns = REPORT_HEADERS.map((header) => ({
    header,
    key: header,
    width: header === "steps" || header.includes("result") ? 50 : 28,
  }));
  details.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  details.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF547A36" },
  };
  details.views = [{ state: "frozen", ySplit: 1 }];

  for (const { testCase, actualResult, status } of results) {
    details.addRow({
      id: testCase.id,
      description: testCase.description,
      steps: testCase.steps,
      "pre-condition": testCase.preCondition,
      "expected result": testCase.expectedResult,
      "actual result": actualResult,
      status,
    });
  }

  const summary = workbook.addWorksheet("Summary");
  const passed = results.filter(({ status }) => status === "PASS").length;
  const failed = results.filter(({ status }) => status === "FAILED").length;
  const blocked = results.filter(({ status }) => status === "BLOCKED").length;
  summary.addRows([
    ["Metric", "Count"],
    ["Total", results.length],
    ["PASS", passed],
    ["FAILED", failed],
    ["BLOCKED", blocked],
    ["Generated at", new Date().toISOString()],
  ]);
  summary.getRow(1).font = { bold: true };
  summary.getColumn(1).width = 22;
  summary.getColumn(2).width = 30;

  await mkdir(dirname(filePath), { recursive: true });
  await workbook.xlsx.writeFile(filePath);
  return { total: results.length, passed, failed, blocked };
}
