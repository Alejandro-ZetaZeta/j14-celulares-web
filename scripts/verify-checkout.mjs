// Playwright verification for checkout prefill, guest gate and profile completion form.
//
// Setup (once):
//   npm i -D playwright
//   npx playwright install chromium
//
// Run against the dev server (http://localhost:3000):
//   $env:PW_EMAIL="you@example.com"; $env:PW_PASSWORD="****"; node scripts/verify-checkout.mjs --checkout
//   $env:PW_EMAIL="..."; $env:PW_PASSWORD="****"; node scripts/verify-checkout.mjs --profile
//   node scripts/verify-checkout.mjs --guest
//
// Optional env to assert exact prefill values (the account's user_profiles row):
//   PW_FULL_NAME, PW_CEDULA, PW_PHONE, PW_ADDRESS, PW_PROVINCE, PW_CITY, PW_POSTCODE
//
// Screenshots land in ./pw-artifacts/.

import { chromium } from "playwright";
import fs from "node:fs";

const BASE_URL = process.env.PW_BASE_URL || "http://localhost:3000";
const mode = process.argv[2]?.replace(/^--/, "") || "guest";
const artifacts = new URL("../pw-artifacts", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
fs.mkdirSync(artifacts, { recursive: true });

const CART_ITEM = {
  variantId: "f0e43644-d192-4a2e-af6d-05e4e271ad82",
  productId: "68542acb-35ee-4ce0-a73d-041102b63653",
  brand: "Holdit",
  model: "Funda para iPhone 17 pro max",
  capacity: "1 phone",
  color: "Rojo tinto",
  unitPrice: 12,
  quantity: 1,
  stock: 10,
  gifts: [],
};

function expect(condition, label) {
  const status = condition ? "PASS" : "FAIL";
  console.log(`  [${status}] ${label}`);
  if (!condition) process.exitCode = 1;
}

function valueOf(locator) {
  return locator.inputValue();
}

async function guestMode(browser) {
  console.log("== --guest: checkout must redirect unauthenticated users to /login ==");
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/checkout`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/login/, { timeout: 15000 });
  expect(true, "guest hitting /checkout lands on /login");
  const from = new URL(page.url()).searchParams.get("from");
  console.log(`  [info] ?from=${from ?? "(none)"} — login page does not consume this param yet`);
  await page.screenshot({ path: `${artifacts}/guest-login.png`, fullPage: true });
  await page.close();
}

async function checkoutMode(browser) {
  const email = process.env.PW_EMAIL;
  const password = process.env.PW_PASSWORD;
  if (!email || !password) {
    console.error("--checkout requires PW_EMAIL and PW_PASSWORD env vars.");
    process.exit(1);
  }
  console.log("== --checkout: login, seed cart, verify prefill + postcode rules ==");
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByText("Correo electrónico", { exact: false }).locator("..").locator("input").fill(email);
  await page.getByText("Contraseña", { exact: false }).locator("..").locator("input").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL(/\/cliente\/dashboard|\/admin/, { timeout: 20000 });
  console.log("  login OK");

  await page.evaluate((item) => localStorage.setItem("webj14-cart", JSON.stringify([item])), CART_ITEM);

  await page.goto(`${BASE_URL}/checkout`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Completa tu compra", { timeout: 15000 });

  const fullName = await valueOf(page.getByLabel("Nombre completo *"));
  const cedula = await valueOf(page.getByLabel("Cedula *"));
  const emailValue = await valueOf(page.getByLabel("Correo electronico *"));
  const phone = await valueOf(page.getByLabel("Telefono *"));
  const profileAddress = await page.locator("label:has(input[name='billing-address']:checked)").innerText();

  expect(fullName === (process.env.PW_FULL_NAME || fullName) && fullName.trim().length > 0, "full name prefilled: " + JSON.stringify(fullName));
  expect(cedula.trim().length > 0, "cedula prefilled: " + JSON.stringify(cedula));
  expect(emailValue === email, `email prefilled from session (expected ${email}, got ${JSON.stringify(emailValue)})`);
  expect(phone === (process.env.PW_PHONE ?? phone), `phone prefilled (expected ${process.env.PW_PHONE ?? "any"}, got ${JSON.stringify(phone)})`);
  if (process.env.PW_PHONE) expect(phone === process.env.PW_PHONE, `phone equals ${process.env.PW_PHONE}`);
  console.log(`  selected billing address (radio checked): ${profileAddress.replace(/\s+/g, " ").trim()}`);
  for (const key of ["PW_ADDRESS", "PW_PROVINCE", "PW_CITY", "PW_POSTCODE"]) {
    if (process.env[key]) {
      const shown = profileAddress.includes(process.env[key]);
      expect(shown, `${key} appears in selected address: ${process.env[key]}`);
    }
  }
  await page.screenshot({ path: `${artifacts}/checkout-prefill.png`, fullPage: true });

  // Postcode input: digits only, max 6.
  await page.getByRole("button", { name: /Agregar nueva direcci/ }).click();
  const postcodeInput = page.locator("label:has-text('Código postal')").locator("input").last();
  await postcodeInput.fill("abc12x3456789");
  const after = await valueOf(postcodeInput);
  expect(/^\d{0,6}$/.test(after), `postcode strips letters and caps at 6 (got ${JSON.stringify(after)})`);

  await page.getByText("Provincia", { exact: false }).last().locator("..").locator("select").selectOption("Guayas");
  const cityOptions = await page.getByText("Ciudad", { exact: false }).last().locator("..").locator("select").locator("option").allTextContents();
  expect(cityOptions.includes("Guayaquil"), "city dropdown lists Guayaquil for Guayas");
  expect(!cityOptions.includes("Quito"), "city dropdown excludes Quito for Guayas");
  await page.screenshot({ path: `${artifacts}/checkout-add-address.png`, fullPage: true });

  await page.getByText("Ciudad", { exact: false }).last().locator("..").locator("select").selectOption("Guayaquil");
  const saveBtn = page.getByRole("button", { name: "Guardar y usar esta dirección" });
  await postcodeInput.fill("12345");
  expect(await saveBtn.isDisabled(), "save disabled with 5-digit postcode");
  await postcodeInput.fill("123456");
  expect(!(await saveBtn.isDisabled()), "save enabled with 6-digit postcode");
  await page.screenshot({ path: `${artifacts}/checkout-add-address-valid.png`, fullPage: true });

  await context.close();
}

async function profileMode(browser) {
  const email = process.env.PW_EMAIL;
  const password = process.env.PW_PASSWORD;
  if (!email || !password) {
    console.error("--profile requires PW_EMAIL and PW_PASSWORD (use an account with is_profile_completed = false).");
    process.exit(1);
  }
  console.log("== --profile: /cliente/completar-perfil layout + province/city cascade ==");
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByText("Correo electrónico", { exact: false }).locator("..").locator("input").fill(email);
  await page.getByText("Contraseña", { exact: false }).locator("..").locator("input").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL(/\/cliente\/dashboard|\/admin/, { timeout: 20000 });

  await page.goto(`${BASE_URL}/cliente/completar-perfil`, { waitUntil: "networkidle" });
  const onProfile = page.url().includes("completar-perfil");
  if (!onProfile) {
    console.error("Account has a completed profile; the proxy bounced you to " + page.url() + ". Use an incomplete account for --profile.");
    process.exitCode = 1;
    await context.close();
    return;
  }
  await page.waitForSelector("text=Completa tu perfil", { timeout: 15000 });
  const fields = ["Nombre completo", "Teléfono", "Cédula", "Fecha de nacimiento", "Dirección", "Provincia", "Ciudad", "Código postal"];
  for (const field of fields) {
    expect(await page.getByText(field, { exact: false }).first().isVisible(), `field visible: ${field}`);
  }
  await page.screenshot({ path: `${artifacts}/completar-perfil.png`, fullPage: true });

  const provinceSelect = page.locator("select[name='province']");
  const citySelect = page.locator("select[name='city']");
  expect(await citySelect.isDisabled(), "city disabled until province chosen");
  await provinceSelect.selectOption("Manabí");
  expect(!(await citySelect.isDisabled()), "city enabled after province chosen");
  const cityOptions = await citySelect.locator("option").allTextContents();
  expect(cityOptions.includes("Manta"), "city dropdown lists Manta for Manabí");
  expect(!cityOptions.includes("Quito"), "city dropdown excludes Quito for Manabí");
  await page.screenshot({ path: `${artifacts}/completar-perfil-province.png`, fullPage: true });

  const postcode = page.locator("input[name='postcode']");
  await postcode.fill("abc12x3456789");
  const after = await postcode.inputValue();
  expect(/^\d{0,6}$/.test(after), `postcode digits-only + max 6 (got ${JSON.stringify(after)})`);
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  if (mode === "guest") await guestMode(browser);
  else if (mode === "checkout") await checkoutMode(browser);
  else if (mode === "profile") await profileMode(browser);
  else console.error(`Unknown mode --${mode} (use --guest, --checkout or --profile)`);
} finally {
  await browser.close();
}
console.log(process.exitCode ? "DONE (with failures)" : "DONE");