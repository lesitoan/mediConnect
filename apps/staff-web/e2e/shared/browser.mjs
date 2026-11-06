import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const DEFAULT_TIMEOUT_MS = 15_000;

function xpathLiteral(value) {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;
  return `concat('${value.replaceAll("'", `', "'", '`)}')`;
}

export async function createBrowser(e2eNow) {
  const options = new chrome.Options();
  options.addArguments("--start-maximized", "--disable-notifications");

  if (process.env.E2E_HEADLESS === "true") {
    options.addArguments("--headless=new", "--window-size=1440,1000");
  }

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({
    implicit: 0,
    pageLoad: 30_000,
    script: 15_000,
  });
  await driver.sendDevToolsCommand("Emulation.setTimezoneOverride", {
    timezoneId: "Asia/Ho_Chi_Minh",
  });
  const timestamp = Date.parse(e2eNow);
  const clockScript = `(() => {
    const fixedTimestamp = ${timestamp};
    const NativeDate = Date;
    class E2EDate extends NativeDate {
      constructor(...args) {
        super(...(args.length === 0 ? [fixedTimestamp] : args));
      }
      static now() {
        return fixedTimestamp;
      }
    }
    Object.setPrototypeOf(E2EDate, NativeDate);
    Object.setPrototypeOf(E2EDate.prototype, NativeDate.prototype);
    globalThis.Date = E2EDate;
  })();`;
  await driver.sendDevToolsCommand("Page.addScriptToEvaluateOnNewDocument", {
    source: clockScript,
  });
  await driver.executeScript(clockScript);

  return driver;
}

export async function openStaffPage(driver, baseUrl, route) {
  const url = new URL(route, baseUrl);
  await driver.get(url.href);
  await driver.wait(
    () => driver.executeScript("return document.readyState === 'complete';"),
    DEFAULT_TIMEOUT_MS,
    `Page "${url.pathname}" did not finish loading.`,
  );
}

async function enterInputValue(driver, locator, value) {
  let lastStaleError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      let input;
      try {
        input = await driver.wait(
          until.elementLocated(locator),
          DEFAULT_TIMEOUT_MS,
        );
      } catch (error) {
        if (!(error instanceof Error) || error.name !== "TimeoutError") {
          throw error;
        }
        const pageState = await driver.executeScript(
          `return {
            url: window.location.href,
            title: document.title,
            headings: [...document.querySelectorAll("h1, h2")]
              .map((heading) => heading.innerText.trim())
              .filter(Boolean),
            inputs: [...document.querySelectorAll("input")]
              .map((input) => ({
                id: input.id,
                type: input.type,
                isVisible: input.getClientRects().length > 0,
              })),
            bodyText: (document.body?.innerText ?? "").slice(0, 500),
          };`,
        );
        throw new Error(
          `Login field was not found. Page state: ${JSON.stringify(pageState)}.`,
          { cause: error },
        );
      }
      await driver.wait(until.elementIsVisible(input), DEFAULT_TIMEOUT_MS);
      await driver.wait(until.elementIsEnabled(input), DEFAULT_TIMEOUT_MS);
      await driver.executeScript(
        "arguments[0].scrollIntoView({ block: 'center' });",
        input,
      );
      await driver.executeScript(
        "const input = arguments[0]; const value = arguments[1]; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));",
        input,
        value,
      );
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
  throw new Error("Could not enter login credentials because the page kept updating.", {
    cause: lastStaleError,
  });
}

async function enterLoginCredentials(driver, email, password) {
  const loginButton = By.xpath(
    "//button[.//span[normalize-space(.)='Đăng nhập hệ thống']]",
  );
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await enterInputValue(driver, By.id("identifier"), email);
    await enterInputValue(driver, By.id("password"), password);
    try {
      await driver.wait(
        async () => {
          for (const button of await driver.findElements(loginButton)) {
            if (
              (await button.isDisplayed()) &&
              (await button.isEnabled())
            ) {
              return true;
            }
          }
          return false;
        },
        2_000,
        "The login form did not retain the entered credentials.",
      );
      return;
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "TimeoutError") {
        throw error;
      }
      lastError = error;
    }
  }

  throw new Error(
    "The login form did not retain the entered credentials.",
    { cause: lastError },
  );
}

async function waitForLoginPageReady(driver) {
  try {
    await driver.wait(
      async () =>
        driver.executeScript(`return (() => {
        const hasCompletedSessionCheck = performance
          .getEntriesByType("resource")
          .some((entry) => {
            try {
              return new URL(entry.name).pathname.endsWith("/me") &&
                entry.responseEnd > 0;
            } catch {
              return false;
            }
          });
        const identifier = document.getElementById("identifier");
        const password = document.getElementById("password");
        const submitButton = document.querySelector('button[type="submit"]');
        return hasCompletedSessionCheck &&
          identifier instanceof HTMLInputElement &&
          !identifier.disabled &&
          password instanceof HTMLInputElement &&
          !password.disabled &&
          submitButton?.innerText.includes("Đăng nhập hệ thống");
        })()`),
      DEFAULT_TIMEOUT_MS,
      "The login page did not finish checking the current session.",
    );
  } catch (error) {
    const state = await driver.executeScript(`return (() => ({
      url: window.location.href,
      completedSessionPaths: performance
        .getEntriesByType("resource")
        .map((entry) => {
          try {
            return new URL(entry.name).pathname;
          } catch {
            return null;
          }
        })
        .filter((path) => path?.endsWith("/me")),
      identifierDisabled: document.getElementById("identifier")?.disabled,
      passwordDisabled: document.getElementById("password")?.disabled,
      submitText: document.querySelector('button[type="submit"]')?.innerText,
    }))()`);
    throw new Error(
      `The login page did not finish checking the current session: ${JSON.stringify(state)}.`,
      { cause: error },
    );
  }
}

export async function loginAsStaffRole(driver, baseUrl, role) {
  const credentialsByRole = {
    RECEPTIONIST: {
      email: process.env.E2E_RECEPTION_EMAIL,
      password: process.env.E2E_RECEPTION_PASSWORD,
      redirect: "/reception",
      landingPath: "/reception",
    },
    DOCTOR: {
      email: process.env.E2E_DOCTOR_EMAIL,
      password: process.env.E2E_DOCTOR_PASSWORD,
      redirect: "/examinations/queue",
      landingPath: "/examinations/queue",
    },
  };
  const credentials = credentialsByRole[role];
  if (!credentials) throw new Error(`Unsupported E2E staff role "${role}".`);
  const { email, password, redirect, landingPath } = credentials;
  if (!email || !password) {
    const environmentRole = role === "RECEPTIONIST" ? "RECEPTION" : role;
    throw new Error(
      `Set E2E_${environmentRole}_EMAIL and E2E_${environmentRole}_PASSWORD for the local test account.`,
    );
  }

  await clearStaffSession(driver, baseUrl);
  await openStaffPage(
    driver,
    baseUrl,
    `/login?redirect=${encodeURIComponent(redirect)}`,
  );

  await waitForLoginPageReady(driver);
  await enterLoginCredentials(driver, email, password);

  const loginButton = await driver.wait(
    until.elementLocated(
      By.xpath("//button[.//span[normalize-space(.)='Đăng nhập hệ thống']]"),
    ),
    DEFAULT_TIMEOUT_MS,
  );
  await driver.wait(until.elementIsVisible(loginButton), DEFAULT_TIMEOUT_MS);
  await driver.wait(until.elementIsEnabled(loginButton), DEFAULT_TIMEOUT_MS);
  await driver.executeScript("arguments[0].click();", loginButton);
  try {
    await driver.wait(until.urlContains(landingPath), DEFAULT_TIMEOUT_MS);
  } catch (error) {
    const state = await driver.executeScript(`return {
      url: window.location.href,
      text: (document.body?.innerText ?? "").slice(0, 500),
    };`);
    throw new Error(
      `Could not reach "${landingPath}" after logging in as ${role}. Page state: ${JSON.stringify(state)}.`,
      { cause: error },
    );
  }
  await waitForText(
    driver,
    role === "DOCTOR"
      ? "Hàng chờ khám của tôi"
      : "Tiếp nhận & Check-in Bệnh nhân",
  );
}

export async function clearStaffSession(driver, baseUrl) {
  await driver.sendDevToolsCommand("Storage.clearDataForOrigin", {
    origin: new URL(baseUrl).origin,
    storageTypes: "all",
  });
  await driver.sendDevToolsCommand("Network.clearBrowserCookies");
}

export async function findInputByPlaceholder(driver, placeholder) {
  const locator = By.xpath(
    `//input[contains(@placeholder, ${xpathLiteral(placeholder)})]`,
  );
  return driver.wait(until.elementLocated(locator), DEFAULT_TIMEOUT_MS);
}

export async function clickButtonByText(driver, text, root = driver) {
  const locator = By.xpath(
    `.//button[contains(normalize-space(.), ${xpathLiteral(text)})]`,
  );
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let button;
    try {
      button = await driver.wait(
        async () => {
          for (const candidate of await root.findElements(locator)) {
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
        DEFAULT_TIMEOUT_MS,
      );
    } catch (error) {
      const state = await driver.executeScript(
        `const text = arguments[0];
        const isVisible = (element) => {
          const style = window.getComputedStyle(element);
          return style.visibility !== "hidden" &&
            style.display !== "none" &&
            element.getClientRects().length > 0;
        };
        return {
          inputs: [...document.querySelectorAll("input")]
            .filter(isVisible)
            .map((input) => ({
              id: input.id,
              type: input.type,
              disabled: input.disabled,
              valueLength: input.value.length,
            })),
          matchingButtons: [...document.querySelectorAll("button")]
            .filter((button) => button.innerText.includes(text) && isVisible(button))
            .map((button) => ({
              text: button.innerText.trim(),
              disabled: button.disabled ||
                button.getAttribute("aria-disabled") === "true",
            })),
          alerts: [...document.querySelectorAll('[role="alert"]')]
            .filter(isVisible)
            .map((alert) => alert.innerText.trim()),
          selects: [...document.querySelectorAll('button[role="combobox"]')]
            .filter(isVisible)
            .map((select) => ({
              selectedOption: select.innerText.trim(),
              isDisabled: select.disabled,
            })),
          errors: [...document.querySelectorAll('[role="dialog"] .text-error')]
            .filter(isVisible)
            .map((error) => error.innerText.trim())
            .filter(Boolean),
          selectedSlots: [...document.querySelectorAll('[role="dialog"] button')]
            .filter((button) =>
              isVisible(button) &&
              /^\d{2}:\d{2}\s-\s\d{2}:\d{2}$/.test(button.innerText.trim()) &&
              button.className.includes("border-primary")
            )
            .map((button) => button.innerText.trim()),
        };`,
        text,
      );
      throw new Error(
        `Could not click button "${text}". UI state: ${JSON.stringify(state)}.`,
        { cause: error },
      );
    }
    try {
      await button.click();
      return button;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.name !== "StaleElementReferenceError" ||
        attempt === 2
      ) {
        throw error;
      }
    }
  }
  throw new Error(`Could not click a button containing "${text}".`);
}

export async function clickText(driver, text) {
  const locator = By.xpath(
    `//*[self::button or self::a][contains(normalize-space(.), ${xpathLiteral(text)})]`,
  );
  const elements = await driver.findElements(locator);
  for (const element of elements) {
    if ((await element.isDisplayed()) && (await element.isEnabled())) {
      await element.click();
      return element;
    }
  }
  throw new Error(`Could not find a clickable element containing "${text}".`);
}

export async function waitForText(driver, text, timeout = DEFAULT_TIMEOUT_MS) {
  await driver.wait(async () => {
    const visibleText = await driver.executeScript(
      "return document.body?.innerText ?? '';",
    );
    return visibleText.includes(text);
  }, timeout);
}

export async function waitForTextToDisappear(
  driver,
  text,
  timeout = DEFAULT_TIMEOUT_MS,
) {
  await driver.wait(async () => {
    const visibleText = await driver.executeScript(
      "return document.body?.innerText ?? '';",
    );
    return !visibleText.includes(text);
  }, timeout);
}

export async function findVisibleTextContainer(driver, text) {
  const locator = By.xpath(
    `//*[contains(normalize-space(.), ${xpathLiteral(text)})]`,
  );
  const elements = await driver.findElements(locator);
  for (const element of elements) {
    if (await element.isDisplayed()) return element;
  }
  throw new Error(`Could not find visible page content containing "${text}".`);
}

export async function findActionContainer(driver, text, buttonText) {
  const locator = By.xpath(
    `//*[contains(normalize-space(.), ${xpathLiteral(text)})]/ancestor::*[.//button[contains(normalize-space(.), ${xpathLiteral(buttonText)})]][1]`,
  );
  const elements = await driver.findElements(locator);
  for (const element of elements) {
    if (await element.isDisplayed()) return element;
  }
  throw new Error(
    `Could not find a visible container for "${text}" with button "${buttonText}".`,
  );
}

export async function waitForLocalServices({
  staffWebUrl,
  apiBaseUrl,
  timeoutMs = 30_000,
}) {
  const checks = [
    { name: "staff-web", url: staffWebUrl },
    { name: "API", url: `${apiBaseUrl.replace(/\/$/, "")}/health-check` },
  ];
  const deadline = Date.now() + timeoutMs;
  const unavailable = new Set(checks.map(({ name }) => name));

  while (Date.now() < deadline && unavailable.size > 0) {
    for (const check of checks) {
      if (!unavailable.has(check.name)) continue;
      try {
        const response = await fetch(check.url, {
          signal: AbortSignal.timeout(3_000),
        });
        if (response.ok) unavailable.delete(check.name);
      } catch {
        // Retry until the configured readiness timeout expires.
      }
    }
    if (unavailable.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }

  if (unavailable.size > 0) {
    throw new Error(
      `Local service(s) not ready: ${[...unavailable].join(", ")}.`,
    );
  }
}
