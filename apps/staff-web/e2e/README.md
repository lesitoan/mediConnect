# Staff Web E2E Tests

The Selenium runner reads the 74 test cases in
`test-cases/reception-queue.xlsx`, runs their steps against the staff-web UI,
and writes the original testcase fields plus actual result and status to
`results/reception-queue-results.xlsx`.

## Local setup

Use the same local PostgreSQL database and clinic seed used by appointment
E2E. Set one fixed clinic time for the API, staff-web, seed commands, and
Selenium runner. The default matches the appointment runner:

```powershell
$env:E2E_NOW = "2026-11-10T08:30:00+07:00"

Push-Location apps/api
npm run prisma:seed:clinic
npm run prisma:seed:staff
npm run prisma:seed:local-schedules
Pop-Location
```

Set the same `E2E_NOW` value in the API and staff-web terminals before starting
those processes, and in the runner terminal before running tests. Restart the
API after changing the value. If not set in the runner terminal, the runner
uses the appointment E2E default. The API process still needs `E2E_NOW` set
explicitly. The runner rejects malformed timestamps and non-local service
URLs. The browser overrides `Date` but does not freeze Selenium timers.

Start the API and staff-web at `http://localhost:4000` and
`http://localhost:3001`. Configure local receptionist and doctor credentials
in the runner's process environment; do not store passwords in the workbook:

```powershell
$env:E2E_RECEPTION_EMAIL = "receptionist01@example.invalid"
$env:E2E_RECEPTION_PASSWORD = "<local receptionist password>"
$env:E2E_DOCTOR_EMAIL = "doctor01@example.invalid"
$env:E2E_DOCTOR_PASSWORD = "<local doctor password>"
```

## Running

Run all 74 cases, or select a comma-separated subset. The runner prepares the
declared fixture before every testcase and reuses one Chrome window throughout
the run, resetting authentication when the actor changes:

```powershell
node apps/staff-web/e2e/runReceptionTests.mjs
node apps/staff-web/e2e/runReceptionTests.mjs --ids=UC07-TK-01,UC07-WI-08
```

The runner executes seed scripts from `apps/api`, so they load
`apps/api/.env`. Seed scripts reject production and non-local database URLs.
The legacy `--auto-seed` argument remains accepted but is no longer needed.
Only run the suite against the intended local test database.

`receptionQueueCaseMapping.mjs` maps each of the 74 workbook IDs to its actor,
fixture, queue scenario, mutation behavior, and UI test layer. The runner
validates that the workbook's fixture and scenario declarations match this
mapping before executing cases. The testcase `pre-condition` field declares
its fixture:

- `Fixture: reception` prepares the `REC-DEMO-*` patients and `MDC-REC-*`
  appointments.
- `Fixture: queue` prepares the `Q-DEMO-*` queue and appointment data.
- `Queue scenario: FULL`, `WAITING`, `CALL_NEXT`, `EMPTY`, `START`,
  `IN_CONSULTATION`, `IN_CONSULTATION_INCOMPLETE`,
  `IN_CONSULTATION_WITH_PRESCRIPTION`, `SKIP_READY`, `SKIP_WAIT`, `SKIP_179`,
  `SKIP_180`, `SKIP_THIRD`, `RESTORE`, `PRIORITY`, `CALL_BLOCKED_CALLED`, or
  `CALL_BLOCKED_IN_CONSULTATION` selects the queue fixture variant.
  `FULL` is the default when omitted.

Queue coordination cases use `doctor01@example.invalid` (doctor code
`STAFF-DEMO-01`); reception queue filtering uses the shared clinic doctors,
including the general doctor seeded as `SEED-GEN-01`. If the local clinic data
also has the legacy UI-default alias `BS01`, the `FULL` queue fixture uses that
doctor's published slots so the default filter displays its visits. Otherwise,
it falls back to `SEED-GEN-01`. Queue fixture appointments use published
schedules and 30-minute appointment slots on the fixed clinic date; the shared
schedule seed also prepares the prior clinic date for past-appointment
fixtures. Patient, appointment, care-session, and queue fixture records remain
module-specific. Isolated queue
scenarios require an empty queue for `STAFF-DEMO-01`; the runner reports a
fixture error instead of deleting unrelated visits if that condition is not met.

The workbook covers UI behavior only; it does not issue direct API requests.
Each mutating case reloads the relevant page before asserting persisted state.
The runner removes a mutating case's demo records afterward and cleans all
fixtures used by the run before exiting. Race conditions
such as a slot being claimed between availability check and submission, stale
API versions, and authorization enforcement must be tested separately at the
API level.

Optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `STAFF_WEB_URL` | `http://localhost:3001` | Staff-web base URL |
| `API_BASE_URL` | `http://localhost:4000/api/v1` | API base URL |
| `E2E_INPUT_FILE` | `test-cases/reception-queue.xlsx` | Workbook path relative to `e2e/` |
| `E2E_OUTPUT_FILE` | `results/reception-queue-results.xlsx` | Report path relative to `e2e/` |
| `E2E_HEADLESS` | `false` | Set to `true` for headless Chrome |
| `E2E_NOW` | `2026-11-10T08:30:00+07:00` | Fixed clinic time, matching appointment E2E |
| `E2E_TEST_IDS` | unset | Comma-separated testcase IDs |

The report keeps the five input fields and adds `actual result` and `status`.
Statuses are `PASS`, `FAILED`, or `BLOCKED`; its Summary sheet counts each
status separately. The runner exits unsuccessfully if any case failed or was
blocked. Reports are written under `results/`, which is ignored by Git.

## Test behavior and current product limits

- Patient lookup uses the walk-in reception dialog; its search is debounced and
  does not have a separate Search button.
- Walk-in fixture names contain letters and spaces only; the E2E phone-number
  prefix is reserved for cleanup of test-created patients.
- The walk-in form accepts a birth year, defaults gender to `Nam`, and does not
  require a reason for examination. The corresponding cases verify the actual
  UI behavior rather than validation controls that do not exist.
- Appointment reception lists current-day, actionable session statuses.
  Past, future, cancelled, and completed appointments are asserted as absent.
- Reception fixtures include appointment slots at 08:00, 08:30, and later.
  With the shared default clock at 08:30, these support late, exact-time, and
  before-appointment check-in cases; changing `E2E_NOW` must preserve the
  intended relation to those fixtures.
- The suite covers the 179/180/181-second skip boundary, the third-skip
  transition to `NO_SHOW`, successful restore, dispatch priority, and blocking
  calls while a doctor already has an active visit.
- Search cases include partial and accent-insensitive terms. The current API
  performs case-insensitive substring matching but does not remove Vietnamese
  diacritics, so the no-diacritic testcase records the current no-match result.
- Walk-in validation cases cover adjacent phone, CCCD, and birth-year limits.
- `UC07-TN-12` checks that the pending-resolution appointment cannot be
  checked in and reports the rejection message shown by the UI.
- Queue viewing uses the receptionist queue at `/queues`; queue coordination
  uses the doctor's `/examinations/queue` page. Filter assertions use the
  seeded doctors and patients.
- Supported expected-result directives include `Hiển thị:`, `Không hiển thị:`,
  `Số lượng: text = n`, `Thứ tự: text A < text B`, `Giá trị: field = value`,
  `Nút vô hiệu hóa: text`, `Nút không hiển thị: text`,
  `Mẫu hiển thị: regex`, and `URL chứa:`.
