import { By, Key, until } from "selenium-webdriver";
import {
  clickButtonByText,
  openStaffPage,
  waitForText,
  waitForTextToDisappear,
} from "../../shared/browser.mjs";
import { getReceptionQueueCase } from "./receptionQueueCaseMapping.mjs";

const FUNCTION_CODES = new Set(["TK", "WI", "TN", "HC", "BQ"]);
const STEP_TIMEOUT_MS = 15_000;

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll("đ", "d");
}

function xpathLiteral(value) {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;
  return `concat('${value.replaceAll("'", `', "'", '`)}')`;
}

function getFunctionCode(testCase) {
  const match = testCase.id
    .trim()
    .toUpperCase()
    .match(/^UC07-([A-Z]+)-\d+$/);
  if (!match || !FUNCTION_CODES.has(match[1])) {
    throw new Error(
      `Unsupported testcase ID "${testCase.id}". Expected UC07-TK/WI/TN/HC/BQ-<number>.`,
    );
  }
  return match[1];
}

export function getReceptionQueueTestRole(testCase) {
  return getReceptionQueueCase(testCase.id).role;
}

function validateStep(step) {
  const supportedPatterns = [
    /^(?:mở|truy cập|đi tới|open|navigate to)\s+(?:trang\s+)?(.+)$/i,
    /^(?:nhập|gõ|điền|type)\s+(.+?)\s+(?:vào|cho|into)\s+(?:ô\s+)?(.+)$/i,
    /^để trống\s+(?:ô\s+)?(.+)$/i,
    /^(?:rời khỏi|làm mất tiêu điểm ô)\s+(.+)$/i,
    /^chọn tùy chọn đầu tiên tại\s+(.+)$/i,
    /^chọn khung giờ đầu tiên$/i,
    /^đóng và xác nhận bỏ dữ liệu$/i,
    /^(?:chọn|select)\s+(.+?)\s+(?:tại|trong|ở)\s+(?:danh sách\s+)?(.+)$/i,
    /^(?:nhấn|bấm|click|chọn)\s+(?:nút\s+|liên kết\s+)?(.+)$/i,
    /^(?:kiểm tra|xác nhận|đợi)\s+(?:nội dung\s+)?["“]?.+?["”]?\s+(?:được\s+)?hiển thị$/i,
    /^(?:kiểm tra|xác nhận|đợi)\s+["“]?.+?["”]?\s+không\s+(?:được\s+)?hiển thị$/i,
  ];
  if (!supportedPatterns.some((pattern) => pattern.test(step)))
    throw new Error(`Unsupported step "${step}".`);
}

export function validateReceptionQueueTestCase(testCase) {
  getFunctionCode(testCase);
  const steps = splitSteps(testCase.steps);
  if (steps.length === 0)
    throw new Error("Testcase không có bước thực thi trong cột steps.");
  for (const step of steps) validateStep(step);
  parseAssertions(testCase.expectedResult);
  return getReceptionQueueTestRole(testCase);
}

function splitSteps(value) {
  return value
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((step) => step.replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").trim())
    .filter(Boolean);
}

function unquote(value) {
  return value
    .trim()
    .replace(/^[“"'`]|[”"'`]$/g, "")
    .replace(/[.!?]+$/, "")
    .trim();
}

function routeForPage(value) {
  const route = value.trim();
  if (/^https?:\/\//i.test(route) || route.startsWith("/")) return route;
  const normalized = normalize(route);
  if (/hang cho.*(bac si|kham cua toi|dieu phoi)/.test(normalized)) {
    return "/examinations/queue";
  }
  if (/hang cho|queue/.test(normalized)) return "/queues";
  if (/tiep nhan|reception|benh nhan/.test(normalized)) return "/reception";
  throw new Error(`Could not map page "${value}" to a local staff-web route.`);
}

async function findInput(driver, target) {
  const label = unquote(target);
  const labelLiteral = xpathLiteral(label);
  const locators = [
    By.xpath(
      `//*[@role="dialog"]//label[contains(normalize-space(.), ${labelLiteral})]//input | //*[@role="dialog"]//label[contains(normalize-space(.), ${labelLiteral})]//textarea`,
    ),
    By.xpath(
      `//*[@role="dialog"]//input[contains(@placeholder, ${labelLiteral})] | //*[@role="dialog"]//textarea[contains(@placeholder, ${labelLiteral})]`,
    ),
    By.xpath(
      `//*[@role="dialog"]//input[contains(@aria-label, ${labelLiteral})] | //*[@role="dialog"]//textarea[contains(@aria-label, ${labelLiteral})]`,
    ),
    By.xpath(
      `//label[contains(normalize-space(.), ${labelLiteral})]//input | //label[contains(normalize-space(.), ${labelLiteral})]//textarea`,
    ),
    By.xpath(
      `//input[contains(@placeholder, ${labelLiteral})] | //textarea[contains(@placeholder, ${labelLiteral})]`,
    ),
    By.xpath(
      `//input[contains(@aria-label, ${labelLiteral})] | //textarea[contains(@aria-label, ${labelLiteral})]`,
    ),
  ];

  for (const locator of locators) {
    const elements = await driver.findElements(locator);
    for (const element of elements) {
      if ((await element.isDisplayed()) && (await element.isEnabled())) {
        return element;
      }
    }
  }

  const normalizedTarget = normalize(label);
  if (/tim|search|tra cuu/.test(normalizedTarget)) {
    const searchInputLocators = [
      By.xpath(
        `//*[@role="dialog"]//input[@type="search" or @placeholder] | //*[@role="dialog"]//textarea[@placeholder]`,
      ),
      By.css('input[type="search"], input[placeholder], textarea[placeholder]'),
    ];
    const searchInputs = [];
    for (const locator of searchInputLocators) {
      for (const element of await driver.findElements(locator)) {
        if (
          !(await element.isDisplayed()) ||
          !(await element.isEnabled()) ||
          searchInputs.includes(element)
        )
          continue;
        searchInputs.push(element);
      }
    }
    for (const element of searchInputs) {
      const placeholder = normalize(
        (await element.getAttribute("placeholder")) ?? "",
      );
      if (
        /tim|search|tra cuu/.test(placeholder) ||
        (await element.getAttribute("type")) === "search"
      ) {
        return element;
      }
    }
  }
  const pageState = await driver.executeScript(`return {
    url: window.location.href,
    dialogs: [...document.querySelectorAll('[role="dialog"]')]
      .filter((dialog) => dialog.getClientRects().length > 0)
      .map((dialog) => ({
        text: dialog.innerText.trim(),
        labels: [...dialog.querySelectorAll("label")]
          .map((item) => item.innerText.trim()),
        inputs: [...dialog.querySelectorAll("input")]
          .map((input) => ({
            type: input.type,
            placeholder: input.placeholder,
            ariaLabel: input.getAttribute("aria-label"),
            visible: input.getClientRects().length > 0,
          })),
      })),
  };`);
  throw new Error(
    `Could not find an enabled input matching "${label}". UI state: ${JSON.stringify(pageState)}.`,
  );
}

async function enterText(driver, target, value) {
  let lastStaleError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      let input;
      try {
        input = await driver.wait(
          async () => {
            try {
              const candidate = await findInput(driver, target);
              return (await candidate.isDisplayed()) &&
                (await candidate.isEnabled())
                ? candidate
                : false;
            } catch (error) {
              if (
                error instanceof Error &&
                (error.name === "StaleElementReferenceError" ||
                  error.message.startsWith(
                    "Could not find an enabled input matching",
                  ))
              ) {
                return false;
              }
              throw error;
            }
          },
          STEP_TIMEOUT_MS,
          `Could not find an enabled input matching "${target}".`,
        );
      } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
          await findInput(driver, target);
        }
        throw error;
      }
      await driver.wait(until.elementIsVisible(input), STEP_TIMEOUT_MS);
      await driver.wait(until.elementIsEnabled(input), STEP_TIMEOUT_MS);
      await driver.executeScript(
        "arguments[0].scrollIntoView({ block: 'center' });",
        input,
      );
      if ((await input.getAttribute("type")) === "date") {
        await driver.executeScript(
          "const input = arguments[0]; const value = arguments[1]; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));",
          input,
          resolveFixtureTokens(value),
        );
        return;
      }
      await input.click();
      await input.sendKeys(Key.CONTROL, "a");
      await input.sendKeys(resolveFixtureTokens(value));
      return;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.name !== "StaleElementReferenceError"
      ) {
        throw error;
      }
      lastStaleError = error;
    }
  }
  throw new Error(
    `Could not enter text into "${unquote(target)}" because the page kept updating.`,
    { cause: lastStaleError },
  );
}

function getClinicDateString(offsetDays = 0) {
  const now = new Date(
    process.env.E2E_NOW ?? "2026-11-10T08:30:00+07:00",
  );
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  const clinicDate = new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day) + offsetDays,
    ),
  );
  return [
    clinicDate.getUTCFullYear(),
    String(clinicDate.getUTCMonth() + 1).padStart(2, "0"),
    String(clinicDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function resolveFixtureTokens(value) {
  const currentYear = new Date(
    process.env.E2E_NOW ?? "2026-11-10T08:30:00+07:00",
  ).getFullYear();
  return value
    .replaceAll("{{TOMORROW}}", getClinicDateString(1))
    .replaceAll("{{CURRENT_YEAR}}", String(currentYear))
    .replaceAll("{{NEXT_YEAR}}", String(currentYear + 1));
}

async function hasVisibleDialog(driver) {
  return driver.executeScript(
    `return [...document.querySelectorAll('[role="dialog"]')].some((dialog) => {
      const style = window.getComputedStyle(dialog);
      return style.visibility !== "hidden" &&
        style.display !== "none" &&
        dialog.getClientRects().length > 0;
    });`,
  );
}

async function hasWalkInDialog(driver) {
  return driver.executeScript(
    `return [...document.querySelectorAll('[role="dialog"]')].some((dialog) => {
      const style = window.getComputedStyle(dialog);
      return style.visibility !== "hidden" &&
        style.display !== "none" &&
        dialog.getClientRects().length > 0 &&
        dialog.querySelector('input[placeholder*="mã BN"]') !== null;
    });`,
  );
}

async function clickQueueAction(driver, actionText) {
  const actionLiteral = xpathLiteral(actionText);
  const actionLocator = By.xpath(
    `//button[normalize-space(.)=${actionLiteral} or starts-with(normalize-space(.), ${xpathLiteral(`${actionText} (`)})]`,
  );
  await clickLocatedElement(
    driver,
    actionLocator,
    `queue action "${actionText}"`,
  );

  const hasConfirmationButton = async () => {
    if (!(await hasVisibleDialog(driver))) return false;
    const confirmButtons = await driver.findElements(
      By.xpath(
        `//*[@role="dialog"]//button[normalize-space(.)=${xpathLiteral("Xác nhận")}]`,
      ),
    );
    for (const button of confirmButtons) {
      if (await button.isDisplayed()) return true;
    }
    return false;
  };
  const waitForConfirmationButton = () =>
    driver.wait(
      async () => {
        try {
          return await hasConfirmationButton();
        } catch (error) {
          if (
            error instanceof Error &&
            error.name === "StaleElementReferenceError"
          ) {
            return false;
          }
          throw error;
        }
      },
      2_000,
      `The confirmation dialog for "${actionText}" did not open.`,
    );
  try {
    await waitForConfirmationButton();
    return;
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "TimeoutError") throw error;
  }

  const didTriggerFallback = await driver.executeScript(
    `const text = arguments[0];
    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      return style.visibility !== "hidden" &&
        style.display !== "none" &&
        element.getClientRects().length > 0;
    };
    const button = [...document.querySelectorAll("button")].find((candidate) =>
      isVisible(candidate) &&
      !candidate.disabled &&
      (candidate.innerText.trim() === text ||
        candidate.innerText.trim().startsWith(text + " ("))
    );
    if (!button) return false;
    button.click();
    return true;`,
    actionText,
  );
  if (!didTriggerFallback) {
    throw new Error(
      `Queue action button "${actionText}" disappeared before the retry.`,
    );
  }

  try {
    await waitForConfirmationButton();
  } catch (error) {
    const pageState = await driver.executeScript(
      `return {
        url: window.location.href,
        headings: [...document.querySelectorAll("h1, h2")]
          .map((heading) => heading.innerText.trim())
          .filter(Boolean),
        dialogs: [...document.querySelectorAll('[role="dialog"]')]
          .filter((dialog) => dialog.getClientRects().length > 0)
          .map((dialog) => ({
            text: dialog.innerText.trim(),
            buttons: [...dialog.querySelectorAll("button")]
              .map((button) => ({
                text: button.innerText.trim(),
                disabled: button.disabled,
              })),
          })),
        matchingActions: [...document.querySelectorAll("button")]
          .filter((button) => button.innerText.trim().includes(arguments[0]))
          .map((button) => ({
            text: button.innerText.trim(),
            disabled: button.disabled,
          })),
        pageText: (document.body?.innerText ?? "").slice(0, 1000),
      };`,
      actionText,
    );
    throw new Error(
      `Queue action "${actionText}" did not open its confirmation dialog. UI state: ${JSON.stringify(pageState)}.`,
      { cause: error },
    );
  }
}

async function ensureWalkInDialog(driver) {
  if (!(await hasWalkInDialog(driver))) {
    const receptionButton = await driver.wait(
      async () => {
        const buttons = await driver.findElements(
          By.xpath(
            `//button[contains(normalize-space(.), ${xpathLiteral("Tiếp nhận vãng lai")})]`,
          ),
        );
        for (const button of buttons) {
          if ((await button.isDisplayed()) && (await button.isEnabled())) {
            return button;
          }
        }
        return false;
      },
      STEP_TIMEOUT_MS,
      "Could not find an enabled walk-in reception button.",
    );
    await driver.executeScript("arguments[0].click();", receptionButton);
    await driver.wait(
      () => hasWalkInDialog(driver),
      STEP_TIMEOUT_MS,
      "The walk-in reception dialog did not open.",
    );
  }
}

async function selectWalkInPatient(driver, patientCode) {
  await ensureWalkInDialog(driver);
  await enterText(driver, "Tìm kiếm", patientCode);
  await clickLocatedElement(
    driver,
    By.xpath(
      `//*[@role="dialog"]//button[contains(normalize-space(.), ${xpathLiteral(patientCode)})]`,
    ),
    `patient "${patientCode}"`,
  );
}

async function clickAppointmentAction(driver, appointmentCode) {
  const actionButton = await driver.wait(
    async () => {
      const buttons = await driver.findElements(
        By.xpath(
          `//tr[contains(normalize-space(.), ${xpathLiteral(appointmentCode)})]//button[normalize-space(.)="Check-in"]`,
        ),
      );
      for (const button of buttons) {
        if ((await button.isDisplayed()) && (await button.isEnabled())) {
          return button;
        }
      }
      return false;
    },
    STEP_TIMEOUT_MS,
    `Could not find an enabled Check-in action for "${appointmentCode}".`,
  );
  await driver.executeScript("arguments[0].click();", actionButton);
  await driver.wait(
    async () => {
      const buttons = await driver.findElements(
        By.xpath(
          `//*[@role="dialog"]//button[normalize-space(.)="Xác nhận Check-in"]`,
        ),
      );
      for (const button of buttons) {
        if (await button.isDisplayed()) return true;
      }
      return false;
    },
    STEP_TIMEOUT_MS,
    `The Check-in confirmation dialog did not open for "${appointmentCode}".`,
  );
}

async function clickLocatedElement(driver, locator, description) {
  let lastStaleError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const element = await driver.wait(
      async () => {
        for (const candidate of await driver.findElements(locator)) {
          try {
            if (
              (await candidate.isDisplayed()) &&
              (await candidate.isEnabled())
            ) {
              return candidate;
            }
          } catch (error) {
            if (
              !(error instanceof Error) ||
              error.name !== "StaleElementReferenceError"
            ) {
              throw error;
            }
          }
        }
        return false;
      },
      STEP_TIMEOUT_MS,
      `Could not find an enabled ${description}.`,
    );
    try {
      await element.click();
      return;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.name !== "StaleElementReferenceError"
      ) {
        throw error;
      }
      lastStaleError = error;
    }
  }
  throw new Error(
    `Could not click ${description} because the page kept updating.`,
    { cause: lastStaleError },
  );
}

async function openQueueTurn(driver, queueIdentifier) {
  await enterText(driver, "Tìm kiếm", queueIdentifier);
  await driver.sleep(900);
  await clickLocatedElement(
    driver,
    By.css('button[aria-label^="Chi tiết lượt"]'),
    `details for queue turn "${queueIdentifier}"`,
  );
}

async function selectPatientResult(driver, patientCode) {
  await clickLocatedElement(
    driver,
    By.xpath(
      `//*[@role="dialog"]//button[contains(normalize-space(.), ${xpathLiteral(patientCode)})]`,
    ),
    `patient result "${patientCode}"`,
  );
}

async function selectOption(driver, target, optionText) {
  const label = unquote(target);
  const option = unquote(optionText);
  await chooseOption(driver, label, option);
  await waitForSelectedOption(driver, label, option);
}

async function chooseOption(driver, target, expectedText) {
  const normalizedTarget = normalize(target);
  try {
    await driver.wait(
      async () => {
        try {
          const select = await findSelect(driver, target);
          for (const option of await select.findElements(By.css("option"))) {
            if (
              (await option.isEnabled()) &&
              (await option.getText()).trim() === expectedText
            ) {
              return true;
            }
          }
          return false;
        } catch (error) {
          if (
            error instanceof Error &&
            error.name === "StaleElementReferenceError"
          ) {
            return false;
          }
          throw error;
        }
      },
      STEP_TIMEOUT_MS,
      `Could not find enabled option "${expectedText}" for "${target}".`,
    );
  } catch (error) {
    const selector = /chuyen khoa/.test(normalizedTarget)
      ? 'select[name="specialtyId"]'
      : 'select[name="doctorId"]';
    const availableOptions = await driver.executeScript(
      `const select = document.querySelector(arguments[0]);
      return select ? [...select.options].map((item) => item.text.trim()) : [];`,
      selector,
    );
    throw new Error(
      `Could not find enabled option "${expectedText}" for "${target}". Available: ${JSON.stringify(availableOptions)}.`,
      { cause: error },
    );
  }
  await clickSelectTrigger(driver, target);
  await clickLocatedElement(
    driver,
    By.xpath(
      `//*[@role="listbox"]//*[@role="option"][normalize-space(.)=${xpathLiteral(expectedText)}]`,
    ),
    `option "${expectedText}" for "${target}"`,
  );
}

async function clickSelectTrigger(driver, target) {
  const label = unquote(target);
  const normalizedTarget = normalize(label);
  const locators = [];
  if (/chuyen khoa/.test(normalizedTarget)) {
    locators.push(
      By.css('select[name="specialtyId"] + button[role="combobox"]'),
    );
  } else if (/bac si|doctor/.test(normalizedTarget)) {
    locators.push(
      By.css('select[name="doctorId"] + button[role="combobox"]'),
    );
  }
  locators.push(
    By.xpath(
      `//label[contains(normalize-space(.), ${xpathLiteral(label)})]//button[@role="combobox"]`,
    ),
    By.xpath(
      `//*[@role="group"][.//span[contains(normalize-space(.), ${xpathLiteral(label)} )]]//button[@role="combobox"]`,
    ),
  );

  for (const locator of locators) {
    const candidates = await driver.findElements(locator);
    for (const candidate of candidates) {
      try {
        if ((await candidate.isDisplayed()) && (await candidate.isEnabled())) {
          await clickLocatedElement(
            driver,
            locator,
            `dropdown for "${label}"`,
          );
          return;
        }
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.name !== "StaleElementReferenceError"
        ) {
          throw error;
        }
      }
    }
  }
  throw new Error(`Could not find an enabled dropdown for "${label}".`);
}

async function waitForSelectedOption(driver, target, expectedText) {
  await driver.wait(
    async () => {
      try {
        const select = await findSelect(driver, target);
        const selectedOption = await select.findElement(
          By.css("option:checked"),
        );
        return (await selectedOption.getText()).trim() === expectedText;
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "StaleElementReferenceError"
        ) {
          return false;
        }
        throw error;
      }
    },
    STEP_TIMEOUT_MS,
    `Could not select "${expectedText}" for "${target}".`,
  );
}

async function findSelect(driver, target) {
  const label = unquote(target);
  const normalizedTarget = normalize(label);
  const locators = [];
  if (/chuyen khoa/.test(normalizedTarget)) {
    locators.push(By.css('select[name="specialtyId"]'));
  } else if (/bac si|doctor/.test(normalizedTarget)) {
    locators.push(By.css('select[name="doctorId"]'));
  }
  locators.push(
    By.xpath(
      `//label[contains(normalize-space(.), ${xpathLiteral(label)})]//select`,
    ),
  );
  locators.push(
    By.xpath(
      `//*[@role="dialog"]//select[contains(@aria-label, ${xpathLiteral(label)})]`,
    ),
  );

  for (const locator of locators) {
    for (const element of await driver.findElements(locator)) {
      if (await element.isDisplayed()) return element;
    }
  }
  throw new Error(`Could not find a select control matching "${label}".`);
}

async function selectFirstOption(driver, target) {
  const optionText = await driver.wait(
    async () => {
      try {
        const select = await findSelect(driver, target);
        if (!(await select.isEnabled())) return false;
        for (const option of await select.findElements(By.css("option"))) {
          if (!(await option.isEnabled())) continue;
          const value = await option.getAttribute("value");
          if (!value) continue;
          return (await option.getText()).trim();
        }
        return false;
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "StaleElementReferenceError"
        ) {
          return false;
        }
        throw error;
      }
    },
    STEP_TIMEOUT_MS,
    `No selectable option was available for "${target}".`,
  );
  await chooseOption(driver, target, optionText);
  await waitForSelectedOption(driver, target, optionText);
}

async function clearField(driver, target) {
  const normalizedTarget = normalize(target);
  if (/chuyen khoa|bac si|doctor/.test(normalizedTarget)) {
    const select = await findSelect(driver, target);
    const emptyOption = await select.findElement(By.css('option[value=""]'));
    await emptyOption.click();
    await select.sendKeys(Key.TAB);
    return;
  }

  const input = await findInput(driver, target);
  await input.clear();
  await input.sendKeys(Key.TAB);
}

async function blurField(driver, target) {
  const normalizedTarget = normalize(target);
  if (/chuyen khoa|bac si|doctor/.test(normalizedTarget)) {
    const select = await findSelect(driver, target);
    await select.sendKeys(Key.TAB);
    return;
  }

  const input = await findInput(driver, target);
  await input.sendKeys(Key.TAB);
}

async function selectFirstSlot(driver) {
  const slotCandidates = By.xpath('//*[@role="dialog"]//button');
  const findWalkInSlotAction = async () => {
    for (const candidate of await driver.findElements(slotCandidates)) {
      try {
        const text = (await candidate.getText()).trim();
        if (
          /^\d{2}:\d{2}\s-\s\d{2}:\d{2}$/.test(text) &&
          (await candidate.isDisplayed()) &&
          (await candidate.isEnabled())
        ) {
          return { type: "slot", text };
        }
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.name !== "StaleElementReferenceError"
        ) {
          throw error;
        }
      }
    }
    const loading = await driver.findElements(
      By.xpath(
        '//*[@role="dialog"]//*[normalize-space(.)="Đang tải khung giờ..."]',
      ),
    );
    if (loading.length > 0) return false;

    for (const candidate of await driver.findElements(
      By.xpath(
        '//*[@role="dialog"]//button[contains(normalize-space(.), "Xem ngày có lịch gần nhất")]',
      ),
    )) {
      try {
        if ((await candidate.isDisplayed()) && (await candidate.isEnabled())) {
          return { type: "nearest-date" };
        }
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.name !== "StaleElementReferenceError"
        ) {
          throw error;
        }
      }
    }
    return false;
  };
  let slotAction = await driver.wait(
    findWalkInSlotAction,
    STEP_TIMEOUT_MS,
    "Walk-in slots did not finish loading or no slot action became available.",
  );
  if (slotAction.type === "nearest-date") {
    await clickButtonByText(driver, "Xem ngày có lịch gần nhất");
    slotAction = await driver.wait(
      async () => {
        const action = await findWalkInSlotAction();
        return action?.type === "slot" ? action : false;
      },
      STEP_TIMEOUT_MS,
      "No available appointment time slot was displayed after finding a date.",
    );
  }
  const slotText = slotAction.text;
  const slotLocator = By.xpath(
    `//*[@role="dialog"]//button[normalize-space(.)=${xpathLiteral(slotText)}]`,
  );
  await clickLocatedElement(
    driver,
    slotLocator,
    `appointment time slot "${slotText}"`,
  );
  await driver.wait(
    async () => {
      const [slot] = await driver.findElements(slotLocator);
      return (
        slot &&
        (await slot.getAttribute("class")).includes("border-primary")
      );
    },
    STEP_TIMEOUT_MS,
    `Could not select appointment time slot "${slotText}".`,
  );
}

async function closeWalkInDialog(driver) {
  await clickLocatedElement(
    driver,
    By.css('[role="dialog"] button[aria-label="Đóng"]'),
    "walk-in dialog close button",
  );
  const confirmation = await driver.wait(
    until.alertIsPresent(),
    STEP_TIMEOUT_MS,
  );
  await confirmation.accept();
}

async function clickTarget(driver, text) {
  const target = unquote(text);
  const normalizedTarget = normalize(target);
  if (normalizedTarget === "trang sau") {
    await clickLocatedElement(
      driver,
      By.css('button[aria-label="Trang sau"]'),
      "pagination next page",
    );
    return;
  }
  if (
    normalizedTarget === "tao ho so moi" &&
    (await hasWalkInDialog(driver))
  ) {
    const createProfileButton = await driver.wait(
      async () => {
        const buttons = await driver.findElements(
          By.xpath(
            `//*[@role="dialog"]//button[normalize-space(.)=${xpathLiteral(target)}]`,
          ),
        );
        for (const button of buttons) {
          if ((await button.isDisplayed()) && (await button.isEnabled())) {
            return button;
          }
        }
        return false;
      },
      STEP_TIMEOUT_MS,
      "Could not find an enabled create-profile button.",
    );
    await driver.executeScript("arguments[0].click();", createProfileButton);
    await driver.wait(
      async () => {
        const inputs = await driver.findElements(
          By.xpath(
            '//*[@role="dialog"]//label[contains(normalize-space(.), "Năm sinh")]//input',
          ),
        );
        for (const input of inputs) {
          if (await input.isDisplayed()) return true;
        }
        return false;
      },
      STEP_TIMEOUT_MS,
      "The new-patient form did not open.",
    );
    return;
  }
  if (normalizedTarget.startsWith("xac nhan")) {
    const confirmButton = await driver.wait(
      async () => {
        const buttons = await driver.findElements(
          By.xpath(
            `//*[@role="dialog"]//button[normalize-space(.)=${xpathLiteral(target)}]`,
          ),
        );
        for (const button of buttons) {
          if ((await button.isDisplayed()) && (await button.isEnabled())) {
            return button;
          }
        }
        return false;
      },
      STEP_TIMEOUT_MS,
      "Could not find an enabled confirmation button.",
    );
    await driver.executeScript(
      "arguments[0].scrollIntoView({ block: 'center' }); arguments[0].click();",
      confirmButton,
    );
    try {
      await driver.wait(
        async () =>
          !(await driver.executeScript(
            `const text = arguments[0];
            const isVisible = (element) => {
              const style = window.getComputedStyle(element);
              return style.visibility !== "hidden" &&
                style.display !== "none" &&
                element.getClientRects().length > 0;
            };
            const confirmationStillVisible = [...document.querySelectorAll('[role="dialog"] button')]
              .some((button) => isVisible(button) && button.innerText.trim() === text);
            return confirmationStillVisible;`,
            target,
          )) ||
          (await driver.executeScript(
            `return [...document.querySelectorAll('[role="alert"]')].some((alert) => {
              const style = window.getComputedStyle(alert);
              return style.visibility !== "hidden" &&
                style.display !== "none" &&
                alert.getClientRects().length > 0;
            });`,
          )),
        STEP_TIMEOUT_MS,
        "The confirmation action did not complete or show a validation error.",
      );
    } catch (error) {
      const dialogState = await driver.executeScript(`return {
        dialogs: [...document.querySelectorAll('[role="dialog"]')]
          .filter((dialog) => dialog.getClientRects().length > 0)
          .map((dialog) => ({
            text: dialog.innerText.trim(),
            buttons: [...dialog.querySelectorAll("button")]
              .map((button) => ({
                text: button.innerText.trim(),
                disabled: button.disabled,
              })),
          })),
        alerts: [...document.querySelectorAll('[role="alert"]')]
          .map((alert) => alert.innerText.trim())
          .filter(Boolean),
      };`);
      throw new Error(
        `Confirmation did not complete. UI state: ${JSON.stringify(dialogState)}.`,
        { cause: error },
      );
    }
    return;
  }
  if (/check-in ngay/.test(normalizedTarget)) {
    const checkbox = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//label[contains(normalize-space(.), ${xpathLiteral("Check-in ngay")})]//input[@type="checkbox"]`,
        ),
      ),
      STEP_TIMEOUT_MS,
    );
    if (!(await checkbox.isSelected())) await checkbox.click();
    return;
  }
  const patientCode = target.match(/\bREC-DEMO-[A-Z0-9-]+\b/i)?.[0];
  if (/tiep nhan truc tiep/.test(normalizedTarget) && patientCode) {
    await selectWalkInPatient(driver, patientCode);
    return;
  }
  if (/ho so/.test(normalizedTarget) && patientCode) {
    await selectPatientResult(driver, patientCode);
    return;
  }
  const appointmentCode = target.match(
    /\b(?:MDC-REC|Q-DEMO-A)-[A-Z0-9-]+\b/i,
  )?.[0];
  if (/lich hen|check-in/.test(normalizedTarget) && appointmentCode) {
    await clickAppointmentAction(driver, appointmentCode);
    return;
  }
  const queueIdentifier = target.match(
    /\b(?:REC-DEMO|Q-DEMO)-[A-Z0-9-]+\b/i,
  )?.[0];
  if (/luot/.test(normalizedTarget) && queueIdentifier) {
    await openQueueTurn(driver, queueIdentifier);
    return;
  }
  if (/chuc nang goi benh nhan ke tiep/.test(normalizedTarget)) {
    await clickQueueAction(driver, "Gọi khám");
    return;
  }
  if (/dua tro lai hang cho/.test(normalizedTarget)) {
    await clickQueueAction(driver, "Đưa trở lại");
    return;
  }
  if (
    [
      "Gọi khám",
      "Bắt đầu khám",
      "Hoàn thành",
      "Bỏ qua lượt",
      "Đưa trở lại",
    ].includes(target)
  ) {
    await clickQueueAction(driver, target);
    return;
  }
  const literal = xpathLiteral(target);
  const controlLocator = By.xpath(
    `//button[contains(normalize-space(.), ${literal})] | //a[contains(normalize-space(.), ${literal})]`,
  );
  const hasEnabledControl = await driver.executeScript(
    `const text = arguments[0];
    return [...document.querySelectorAll("button, a")].some((element) => {
      const style = window.getComputedStyle(element);
      return element.innerText.includes(text) &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        element.getClientRects().length > 0 &&
        !element.disabled &&
        element.getAttribute("aria-disabled") !== "true";
    });`,
    target,
  );
  if (hasEnabledControl) {
    await clickLocatedElement(driver, controlLocator, `control "${target}"`);
    return;
  }
  if (/xem hang cho/.test(normalizedTarget)) {
    const viewButtons = await driver.findElements(
      By.xpath(
        `//button[contains(normalize-space(.), ${xpathLiteral("Xem hàng chờ")})]`,
      ),
    );
    for (const button of viewButtons) {
      if ((await button.isDisplayed()) && (await button.isEnabled())) {
        await clickButtonByText(driver, "Xem hàng chờ");
        return;
      }
    }
    await waitForText(driver, "Hàng chờ khám bệnh", STEP_TIMEOUT_MS);
    return;
  }
  if (
    /tiep nhan benh nhan truc tiep|tiep nhan truc tiep/.test(normalizedTarget)
  ) {
    await ensureWalkInDialog(driver);
    if (/tao ho so moi/.test(normalizedTarget)) {
      await clickButtonByText(driver, "Tạo hồ sơ mới");
    }
    return;
  }
  await clickButtonByText(driver, target);
}

async function runStep(driver, baseUrl, step) {
  const normalized = normalize(step);

  if (/^(dang nhap|login)\b/.test(normalized)) {
    return `Dùng phiên đăng nhập đã cấu hình cho testcase: ${step}`;
  }

  const navigateMatch = step.match(
    /^(?:mở|truy cập|đi tới|open|navigate to)\s+(?:trang\s+)?(.+)$/i,
  );
  if (navigateMatch) {
    const page = unquote(navigateMatch[1]);
    const route = routeForPage(page);
    await openStaffPage(driver, baseUrl, route);
    const expectedHeading =
      route === "/examinations/queue"
        ? "Hàng chờ khám của tôi"
        : route === "/queues"
          ? "Hàng chờ khám bệnh"
          : "Tiếp nhận & Check-in Bệnh nhân";
    try {
      await waitForText(driver, expectedHeading, STEP_TIMEOUT_MS);
    } catch (error) {
      const pageState = await driver.executeScript(
        `return {
          url: window.location.href,
          title: document.title,
          headings: [...document.querySelectorAll("h1, h2")]
            .map((heading) => heading.innerText.trim())
            .filter(Boolean),
          alerts: [...document.querySelectorAll('[role="alert"]')]
            .map((alert) => alert.innerText.trim())
            .filter(Boolean),
        };`,
      );
      throw new Error(
        `Page "${route}" did not show "${expectedHeading}". UI state: ${JSON.stringify(pageState)}.`,
        { cause: error },
      );
    }
    if (/tiep nhan vang lai/i.test(normalize(page)))
      await ensureWalkInDialog(driver);
    return `Đã mở ${route}.`;
  }

  const inputMatch = step.match(
    /^(?:nhập|gõ|điền|type)\s+(.+?)\s+(?:vào|cho|into)\s+(?:ô\s+)?(.+)$/i,
  );
  if (inputMatch) {
    const value = unquote(inputMatch[1]);
    await enterText(driver, inputMatch[2], value);
    return `Đã nhập dữ liệu vào "${unquote(inputMatch[2])}".`;
  }

  const clearMatch = step.match(/^để trống\s+(?:ô\s+)?(.+)$/i);
  if (clearMatch) {
    await clearField(driver, clearMatch[1]);
    return `Đã để trống "${unquote(clearMatch[1])}".`;
  }

  const blurMatch = step.match(/^(?:rời khỏi|làm mất tiêu điểm ô)\s+(.+)$/i);
  if (blurMatch) {
    await blurField(driver, blurMatch[1]);
    return `Đã rời khỏi "${unquote(blurMatch[1])}".`;
  }

  const firstOptionMatch = step.match(/^chọn tùy chọn đầu tiên tại\s+(.+)$/i);
  if (firstOptionMatch) {
    await selectFirstOption(driver, firstOptionMatch[1]);
    return `Đã chọn tùy chọn khả dụng đầu tiên tại "${unquote(firstOptionMatch[1])}".`;
  }

  if (/^chọn khung giờ đầu tiên$/i.test(step.trim())) {
    await selectFirstSlot(driver);
    return "Đã chọn khung giờ khả dụng đầu tiên.";
  }

  if (/^đóng và xác nhận bỏ dữ liệu$/i.test(step.trim())) {
    await closeWalkInDialog(driver);
    return "Đã xác nhận đóng hộp thoại và bỏ dữ liệu đang nhập.";
  }

  const selectMatch = step.match(
    /^(?:chọn|select)\s+(.+?)\s+(?:tại|trong|ở)\s+(?:danh sách\s+)?(.+)$/i,
  );
  if (selectMatch) {
    await selectOption(driver, selectMatch[2], selectMatch[1]);
    return `Đã chọn "${unquote(selectMatch[1])}" trong "${unquote(selectMatch[2])}".`;
  }

  const clickMatch = step.match(
    /^(?:nhấn|bấm|click|chọn)\s+(?:nút\s+|liên kết\s+)?(.+)$/i,
  );
  if (clickMatch) {
    if (/tim kiem|search/.test(normalize(clickMatch[1]))) {
      await driver.sleep(500);
      return "Đã chờ giao diện áp dụng tìm kiếm.";
    }
    await clickTarget(driver, clickMatch[1]);
    return `Đã chọn "${unquote(clickMatch[1])}".`;
  }

  const visibleMatch = step.match(
    /^(?:kiểm tra|xác nhận|đợi)\s+(?:nội dung\s+)?["“]?(.+?)["”]?\s+(?:được\s+)?hiển thị$/i,
  );
  if (visibleMatch) {
    await waitForText(driver, unquote(visibleMatch[1]));
    return `Đã xác nhận hiển thị "${unquote(visibleMatch[1])}".`;
  }

  const absentMatch = step.match(
    /^(?:kiểm tra|xác nhận|đợi)\s+["“]?(.+?)["”]?\s+không\s+(?:được\s+)?hiển thị$/i,
  );
  if (absentMatch) {
    await waitForTextToDisappear(driver, unquote(absentMatch[1]));
    return `Đã xác nhận không hiển thị "${unquote(absentMatch[1])}".`;
  }

  throw new Error(
    `Unsupported step "${step}". Use an actionable step beginning with Mở, Nhập, Chọn, Nhấn, or Kiểm tra.`,
  );
}

function parseAssertions(expectedResult) {
  const directives = expectedResult
    .replace(/\r/g, "\n")
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);
  const assertions = [];

  for (const directive of directives) {
    const visibleMatch = directive.match(/^(?:hiển thị|visible)\s*:\s*(.+)$/i);
    if (visibleMatch) {
      assertions.push(
        ...visibleMatch[1]
          .split(/\s*\|\s*|\s*,\s*/)
          .map(unquote)
          .filter(Boolean)
          .map((text) => ({ shouldBeVisible: true, text })),
      );
      continue;
    }

    const countMatch = directive.match(
      /^(?:số lượng|count)\s*:\s*(.+?)\s*=\s*(\d+)$/i,
    );
    if (countMatch) {
      assertions.push({
        type: "count",
        text: unquote(countMatch[1]),
        expectedCount: Number(countMatch[2]),
      });
      continue;
    }

    const orderMatch = directive.match(
      /^(?:thứ tự|order)\s*:\s*(.+?)\s*<\s*(.+)$/i,
    );
    if (orderMatch) {
      assertions.push({
        type: "order",
        before: unquote(orderMatch[1]),
        after: unquote(orderMatch[2]),
      });
      continue;
    }

    const urlMatch = directive.match(/^(?:url chứa|url contains)\s*:\s*(.+)$/i);
    if (urlMatch) {
      assertions.push({ type: "url", text: unquote(urlMatch[1]) });
      continue;
    }

    const valueMatch = directive.match(
      /^(?:giá trị|value)\s*:\s*(.+?)\s*=\s*(.+)$/i,
    );
    if (valueMatch) {
      assertions.push({
        type: "value",
        target: unquote(valueMatch[1]),
        expectedValue: unquote(valueMatch[2]),
      });
      continue;
    }

    const disabledMatch = directive.match(
      /^(?:nút vô hiệu hóa|disabled button)\s*:\s*(.+)$/i,
    );
    if (disabledMatch) {
      assertions.push({
        type: "disabled-button",
        text: unquote(disabledMatch[1]),
      });
      continue;
    }

    const absentButtonMatch = directive.match(
      /^(?:nút không hiển thị|button not visible)\s*:\s*(.+)$/i,
    );
    if (absentButtonMatch) {
      assertions.push(
        ...absentButtonMatch[1]
          .split(/\s*\|\s*|\s*,\s*/)
          .map(unquote)
          .filter(Boolean)
          .map((text) => ({ type: "absent-button", text })),
      );
      continue;
    }

    const rowAbsentButtonMatch = directive.match(
      /^(?:nút trong hàng không hiển thị|button absent in row)\s*:\s*(.+?)\s*\|\s*(.+)$/i,
    );
    if (rowAbsentButtonMatch) {
      assertions.push({
        type: "row-absent-button",
        rowText: unquote(rowAbsentButtonMatch[1]),
        text: unquote(rowAbsentButtonMatch[2]),
      });
      continue;
    }

    const patternMatch = directive.match(
      /^(?:mẫu hiển thị|text matches)\s*:\s*(.+)$/i,
    );
    if (patternMatch) {
      const pattern = unquote(patternMatch[1]);
      try {
        new RegExp(pattern);
      } catch {
        throw new Error(`Invalid expected-result regular expression "${pattern}".`);
      }
      assertions.push({ type: "pattern", pattern });
      continue;
    }

    const absentMatch = directive.match(
      /^(?:không hiển thị|ẩn|not visible)\s*:\s*(.+)$/i,
    );
    if (absentMatch) {
      assertions.push(
        ...absentMatch[1]
          .split(/\s*\|\s*|\s*,\s*/)
          .map(unquote)
          .filter(Boolean)
          .map((text) => ({ shouldBeVisible: false, text })),
      );
      continue;
    }

    throw new Error(`Unsupported expected-result assertion "${directive}".`);
  }

  if (assertions.length === 0) {
    throw new Error(
      'Expected result must contain executable assertions: "Hiển thị: text | text" and/or "Không hiển thị: text".',
    );
  }
  return assertions;
}

async function checkExpectedResults(driver, expectedResult) {
  const assertions = parseAssertions(expectedResult);
  const observations = [];

  for (const assertion of assertions) {
    if (assertion.type === "value") {
      await driver.wait(
        async () => {
          try {
            const select = await findSelect(driver, assertion.target);
            const selectedOption = await select.findElement(
              By.css("option:checked"),
            );
            return (
              (await selectedOption.getText()).trim() ===
              assertion.expectedValue
            );
          } catch (error) {
            if (
              error instanceof Error &&
              error.name === "StaleElementReferenceError"
            ) {
              return false;
            }
            throw error;
          }
        },
        STEP_TIMEOUT_MS,
        `Kỳ vọng giá trị "${assertion.expectedValue}" tại "${assertion.target}".`,
      );
      observations.push(
        `"${assertion.target}" có giá trị "${assertion.expectedValue}"`,
      );
      continue;
    }

    if (assertion.type === "disabled-button") {
      await driver.wait(
        () =>
          driver.executeScript(
            `const text = arguments[0];
            const isVisible = (element) => {
              const style = window.getComputedStyle(element);
              return style.visibility !== "hidden" &&
                style.display !== "none" &&
                element.getClientRects().length > 0;
            };
            const buttons = [...document.querySelectorAll("button")]
              .filter((button) => button.innerText.includes(text) && isVisible(button));
            return buttons.length > 0 &&
              buttons.every((button) =>
                button.disabled || button.getAttribute("aria-disabled") === "true"
              );`,
            assertion.text,
          ),
        STEP_TIMEOUT_MS,
        `Kỳ vọng nút "${assertion.text}" hiển thị và bị vô hiệu hóa.`,
      );
      observations.push(`Nút "${assertion.text}" không thể thao tác`);
      continue;
    }

    if (assertion.type === "absent-button") {
      const isVisible = await driver.executeScript(
        `const text = arguments[0];
        return [...document.querySelectorAll("button")].some((button) => {
          const style = window.getComputedStyle(button);
          return button.innerText.includes(text) &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            button.getClientRects().length > 0;
        });`,
        assertion.text,
      );
      if (isVisible) {
        throw new Error(
          `Kỳ vọng không có nút hiển thị chứa "${assertion.text}".`,
        );
      }
      observations.push(`Không có nút hiển thị "${assertion.text}"`);
      continue;
    }

    if (assertion.type === "row-absent-button") {
      const isVisible = await driver.executeScript(
        `const [rowText, buttonText] = arguments;
        const rows = [...document.querySelectorAll("tr")];
        const row = rows.find((candidate) => candidate.innerText.includes(rowText));
        if (!row) return null;
        return [...row.querySelectorAll("button")].some((button) => {
          const style = window.getComputedStyle(button);
          return button.innerText.includes(buttonText) &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            button.getClientRects().length > 0;
        });`,
        assertion.rowText,
        assertion.text,
      );
      if (isVisible === null) {
        throw new Error(
          `Could not find a table row containing "${assertion.rowText}".`,
        );
      }
      if (isVisible) {
        throw new Error(
          `Kỳ vọng hàng "${assertion.rowText}" không có nút "${assertion.text}".`,
        );
      }
      observations.push(
        `Hàng "${assertion.rowText}" không có nút "${assertion.text}"`,
      );
      continue;
    }

    if (assertion.type === "count") {
      await driver.wait(
        async () => {
          const exactTextElements = await driver.findElements(
            By.xpath(
              `//*[not(*) and normalize-space(.)=${xpathLiteral(assertion.text)}]`,
            ),
          );
          let actualCount = 0;
          for (const element of exactTextElements) {
            if (await element.isDisplayed()) actualCount += 1;
          }
          return actualCount === assertion.expectedCount;
        },
        STEP_TIMEOUT_MS,
        `Kỳ vọng "${assertion.text}" xuất hiện ${assertion.expectedCount} lần.`,
      );
      observations.push(
        `"${assertion.text}" xuất hiện ${assertion.expectedCount} lần`,
      );
      continue;
    }

    if (assertion.type === "order") {
      await driver.wait(
        async () => {
          const currentText = await driver.executeScript(
            "return document.body?.innerText ?? '';",
          );
          const beforeIndex = currentText.indexOf(assertion.before);
          const afterIndex = currentText.indexOf(assertion.after);
          return beforeIndex >= 0 && afterIndex > beforeIndex;
        },
        STEP_TIMEOUT_MS,
        `Kỳ vọng "${assertion.before}" đứng trước "${assertion.after}".`,
      );
      observations.push(
        `"${assertion.before}" đứng trước "${assertion.after}"`,
      );
      continue;
    }

    if (assertion.type === "url") {
      await driver.wait(
        async () => (await driver.getCurrentUrl()).includes(assertion.text),
        STEP_TIMEOUT_MS,
        `Kỳ vọng URL có chứa "${assertion.text}".`,
      );
      observations.push(`URL chứa "${assertion.text}"`);
      continue;
    }

    if (assertion.type === "pattern") {
      const pattern = new RegExp(assertion.pattern);
      await driver.wait(
        async () => {
          const currentText = await driver.executeScript(
            "return document.body?.innerText ?? '';",
          );
          return pattern.test(currentText);
        },
        STEP_TIMEOUT_MS,
        `Kỳ vọng nội dung trang khớp mẫu "${assertion.pattern}".`,
      );
      observations.push(`Nội dung trang khớp mẫu "${assertion.pattern}"`);
      continue;
    }

    const state = assertion.shouldBeVisible ? "hiển thị" : "không hiển thị";
    let currentText = "";
    try {
      await driver.wait(
        async () => {
          currentText = await driver.executeScript(
            "return document.body?.innerText ?? '';",
          );
          return (
            currentText.includes(assertion.text) === assertion.shouldBeVisible
          );
        },
        STEP_TIMEOUT_MS,
        `Kỳ vọng "${assertion.text}" phải ${state}.`,
      );
    } catch (error) {
      const matchingLines = currentText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.includes(assertion.text));
      const pageState = await driver.executeScript(`return {
        url: window.location.href,
        dateInputs: [...document.querySelectorAll('input[type="date"]')]
          .map((input) => input.value),
        alerts: [...document.querySelectorAll('[role="alert"]')]
          .map((alert) => alert.innerText.trim())
          .filter(Boolean),
        queueRequests: performance.getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((name) => name.includes("/queues/board")),
      };`);
      throw new Error(
        `Kỳ vọng "${assertion.text}" phải ${state}. Nội dung khớp: ${JSON.stringify(matchingLines)}. Trang: ${JSON.stringify(currentText.slice(0, 1000))}. State: ${JSON.stringify(pageState)}.`,
        { cause: error },
      );
    }
    observations.push(
      `${assertion.shouldBeVisible ? "Có" : "Không có"} "${assertion.text}"`,
    );
  }
  return observations.join("; ");
}

export async function runReceptionQueueScenario({ driver, baseUrl, testCase }) {
  const functionCode = getFunctionCode(testCase);
  const steps = splitSteps(testCase.steps);
  if (steps.length === 0) {
    throw new Error("Testcase không có bước thực thi trong cột steps.");
  }

  const stepResults = [];
  for (const step of steps) {
    try {
      stepResults.push(await runStep(driver, baseUrl, step));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown step error.";
      throw new Error(`Bước "${step}" thất bại: ${message}`, { cause: error });
    }
  }
  const assertions = await checkExpectedResults(
    driver,
    testCase.expectedResult,
  );

  return [
    `Function UC07-${functionCode}: ${stepResults.join(" ")}`,
    `Đối chiếu kết quả: ${assertions}.`,
  ].join(" ");
}
