import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("student fee api carries per-year groups and per-invoice year labels", async () => {
  const api = await read("src/features/fee/api/studentFeeApi.ts");
  assert.match(api, /yearGroups: FeeYearGroup\[\]/);
  assert.match(api, /interface FeeYearGroup/);
  assert.match(api, /academicYearLabel: string/);
  assert.match(api, /isCurrent: boolean/);
  assert.match(api, /interface FeeInvoiceRecord/);
  assert.match(api, /isCurrentYear: boolean/);
});

test("admin fee api exposes a cross-year student summary lookup", async () => {
  const api = await read("src/features/fee/api/feeApi.ts");
  assert.match(api, /async getStudentFeeSummary\(studentId: string\)/);
  assert.match(api, /\/fees\/students\/\$\{studentId\}\/fees/);
  assert.match(api, /\byearGroups: StudentFeeYearGroup\[\]/);
});

test("generation result type includes prior-year unpaid students", async () => {
  const api = await read("src/features/fee/api/feeApi.ts");
  assert.match(api, /priorYearUnpaid: Array</);
  assert.match(api, /studentName: string/);
  assert.match(api, /\bowed: number\b/);
});

test("student fee page flags prior years as overdue while keeping current year plain", async () => {
  const page = await read("src/features/fee/components/StudentFeePage.tsx");
  assert.match(page, /Overdue from \{year\.academicYearLabel\}/);
  assert.match(page, /year\.totalDue > 0/);
  assert.match(page, /summary\.yearGroups\.map/);
});

test("invoice detail page shows a cross-year student fee overview for admins", async () => {
  const page = await read("src/features/fee/components/FeeInvoiceDetailPage.tsx");
  assert.match(page, /getStudentFeeSummary\(\s*invoice\.enrollment\.studentId\)/);
  assert.match(page, /Student Fee Overview/);
  assert.match(page, /yearGroups\.map/);
});

test("fee structure page warns when generation flags prior-year overdue students", async () => {
  const page = await read("src/features/fee/components/FeeStructureDetailPage.tsx");
  assert.match(page, /result\.priorYearUnpaid\.length > 0/);
  assert.match(page, /still owe fees from a previous year/);
});
