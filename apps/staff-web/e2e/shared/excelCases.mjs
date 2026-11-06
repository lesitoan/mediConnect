import ExcelJS from "exceljs";
import JSZip from "jszip";
import { readFile } from "node:fs/promises";

const REQUIRED_FIELDS = [
  "id",
  "description",
  "steps",
  "preCondition",
  "expectedResult",
];

const HEADER_ALIASES = new Map([
  ["id", "id"],
  ["testcaseid", "id"],
  ["description", "description"],
  ["testcasedescription", "description"],
  ["steps", "steps"],
  ["procedure", "steps"],
  ["testcaseprocedure", "steps"],
  ["precondition", "preCondition"],
  ["preconditions", "preCondition"],
  ["expectedresult", "expectedResult"],
  ["expectedresults", "expectedResult"],
]);

function cellText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) return String(value.text);
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map(({ text }) => text).join("");
  }
  return String(value).trim();
}

function normalizeHeader(value) {
  return cellText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getHeaderMapping(row) {
  const mapping = new Map();
  row.eachCell((cell, columnNumber) => {
    const field = HEADER_ALIASES.get(normalizeHeader(cell.value));
    if (field) mapping.set(field, columnNumber);
  });
  return mapping;
}

function findHeaderRow(worksheet) {
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const mapping = getHeaderMapping(row);
    if (REQUIRED_FIELDS.every((field) => mapping.has(field))) {
      return { rowNumber, mapping };
    }
  }
  throw new Error(
    `Worksheet "${worksheet.name}" must contain the headers: ${REQUIRED_FIELDS.join(", ")}.`,
  );
}

async function loadWorkbook(filePath) {
  const zip = await JSZip.loadAsync(await readFile(filePath));
  const workbookXml = await zip.file("xl/workbook.xml")?.async("string");
  const namespacePrefix = workbookXml?.match(
    /<([A-Za-z_][\w.-]*):workbook\b/,
  )?.[1];
  const workbook = new ExcelJS.Workbook();

  if (!namespacePrefix) {
    await workbook.xlsx.readFile(filePath);
    return workbook;
  }

  for (const [fileName, entry] of Object.entries(zip.files)) {
    if (
      entry.dir ||
      !fileName.startsWith("xl/") ||
      !fileName.endsWith(".xml")
    ) {
      continue;
    }

    let xml = await entry.async("string");
    xml = xml.replace(
      new RegExp(`<(/?)${namespacePrefix}:`, "g"),
      "<$1",
    );

    if (/^xl\/worksheets\/sheet\d+\.xml$/.test(fileName)) {
      // ExcelJS does not reconcile table relationships with absolute package paths.
      xml = xml.replace(/<tableParts\b[^>]*>[\s\S]*?<\/tableParts>/g, "");
    } else if (/^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/.test(fileName)) {
      xml = xml.replace(
        /<Relationship\b(?=[^>]*\bType="[^"]*\/table")[^>]*\/>/g,
        "",
      );
    }

    zip.file(fileName, xml);
  }

  await workbook.xlsx.load(await zip.generateAsync({ type: "nodebuffer" }));
  return workbook;
}

export async function readTestCases(filePath) {
  const workbook = await loadWorkbook(filePath);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("The input workbook has no worksheets.");

  const { rowNumber: headerRowNumber, mapping } = findHeaderRow(worksheet);
  const testCases = [];
  const seenIds = new Set();

  for (
    let rowNumber = headerRowNumber + 1;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);
    const testCase = {
      id: cellText(row.getCell(mapping.get("id")).value),
      description: cellText(row.getCell(mapping.get("description")).value),
      steps: cellText(row.getCell(mapping.get("steps")).value),
      preCondition: cellText(row.getCell(mapping.get("preCondition")).value),
      expectedResult: cellText(
        row.getCell(mapping.get("expectedResult")).value,
      ),
      sourceRow: rowNumber,
    };

    if (REQUIRED_FIELDS.every((field) => !testCase[field])) continue;

    const missingFields = REQUIRED_FIELDS.filter((field) => !testCase[field]);
    if (missingFields.length > 0) {
      throw new Error(
        `Input row ${rowNumber} is missing required field(s): ${missingFields.join(", ")}.`,
      );
    }
    if (seenIds.has(testCase.id)) {
      throw new Error(`Duplicate testcase id "${testCase.id}" at row ${rowNumber}.`);
    }

    seenIds.add(testCase.id);
    testCases.push(testCase);
  }

  if (testCases.length === 0) {
    throw new Error("The input workbook contains no test cases.");
  }

  return testCases;
}
