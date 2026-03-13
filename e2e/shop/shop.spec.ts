import { test, expect, type Page } from "@playwright/test";

const SHOP_BASE = "/bestall";
const CART_PATH = "/kundvagn";
const CHECKOUT_PATH = "/kassa";
const THANK_YOU_PATH = "/bestall/tack";
const PRODUCT_OVERVIEW_LINK_TESTID = "product-overview-link";

/** Navigate to shop, open first product, add to cart (if in stock), then go to cart. Returns true if item was added. */
async function addFirstProductAndGoToCart(page: Page): Promise<boolean> {
  await page.goto(SHOP_BASE);
  const firstProductLink = page
    .getByTestId(PRODUCT_OVERVIEW_LINK_TESTID)
    .first();
  await expect(firstProductLink).toBeVisible();
  await firstProductLink.click();
  await expect(page).toHaveURL(new RegExp(`${SHOP_BASE}/[^/]+$`));
  const submitBtn = page.getByRole("button", { name: /Beställ/ });
  if (!(await submitBtn.isVisible())) return false;
  await submitBtn.click();
  await expect(page.getByText(/lades till i din kundvagn/i)).toBeVisible({
    timeout: 5000,
  });
  await page.getByRole("link", { name: "Visa kundvagn" }).click();
  await expect(page).toHaveURL(CART_PATH);
  return true;
}

/** From any page, get to checkout with one item. Returns true if checkout was reached (cart had an in-stock item). */
async function goToCheckoutWithOneItem(page: Page): Promise<boolean> {
  const added = await addFirstProductAndGoToCart(page);
  if (!added) return false;
  await page.getByRole("link", { name: "Gå till kassan" }).click();
  await expect(page).toHaveURL(CHECKOUT_PATH);
  return true;
}

test.describe("Shop (storefront) – critical path", () => {
  test("storefront loads and product links go to detail", async ({ page }) => {
    const res = await page.goto(SHOP_BASE);
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        name: /Beställ bakverk direkt från bageriet/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Produkter" }),
    ).toBeVisible();
    const productLink = page.getByTestId(PRODUCT_OVERVIEW_LINK_TESTID).first();
    await expect(productLink).toBeVisible();
    const href = await productLink.getAttribute("href");
    expect(href).toMatch(new RegExp(`^${SHOP_BASE}/[^/]+$`));
  });

  test("product detail shows add-to-cart", async ({ page }) => {
    await page.goto(SHOP_BASE);
    await page.getByTestId(PRODUCT_OVERVIEW_LINK_TESTID).first().click();
    await expect(page).toHaveURL(new RegExp(`${SHOP_BASE}/[^/]+$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Visa kundvagn" }),
    ).toBeVisible();
  });

  test("empty cart shows empty state and link to shop", async ({ page }) => {
    await page.goto(CART_PATH);
    await expect(page.getByRole("heading", { name: "Kundvagn" })).toBeVisible();
    await expect(page.getByText("Kundvagnen är tom.")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Fortsätt handla" }),
    ).toBeVisible();
  });

  test("add to cart → cart shows item and checkout link", async ({ page }) => {
    const added = await addFirstProductAndGoToCart(page);
    if (!added) {
      test.skip(true, "No in-stock product to add");
    }
    const list = page.locator("ul").filter({ has: page.locator("form") });
    await expect(list.locator("li").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Sammanställning" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Gå till kassan" }),
    ).toBeVisible();
  });

  test("empty checkout shows cart content (rewrite)", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(CHECKOUT_PATH);
    await expect(page.getByRole("heading", { name: "Kundvagn" })).toBeVisible();
    await expect(page.getByText("Kundvagnen är tom.")).toBeVisible();
  });

  test("checkout with item: form visible and submit goes to thank-you or error", async ({
    page,
  }) => {
    const reached = await goToCheckoutWithOneItem(page);
    if (!reached) {
      test.skip(true, "No in-stock product");
    }
    await expect(page.getByRole("heading", { name: "Kassa" })).toBeVisible();
    await expect(
      page.getByRole("group", { name: "1. Upphämtning" }),
    ).toBeVisible();
    await expect(page.getByLabel("Upphämtningsdatum")).toBeVisible();
    await expect(page.getByLabel("Namn")).toBeVisible();
    await expect(page.getByLabel("E-post")).toBeVisible();
    await expect(page.getByLabel("Telefon")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Slutför beställning" }),
    ).toBeVisible();

    const pickupSelect = page.getByLabel("Upphämtningsdatum");
    const firstDateOption = await pickupSelect
      .locator("option")
      .filter({ hasNotText: /Välj datum|Inga datum/ })
      .first()
      .getAttribute("value");
    if (!firstDateOption) {
      test.skip(true, "No pickup dates available");
    }
    await pickupSelect.selectOption(firstDateOption);
    await page.getByLabel("Namn").fill("E2E Test");
    await page.getByLabel("E-post").fill("e2e@example.com");
    await page.getByLabel("Telefon").fill("0701234567");
    await page.getByRole("button", { name: "Slutför beställning" }).click();

    await page.waitForURL(
      (url) =>
        url.pathname === THANK_YOU_PATH || url.pathname === CHECKOUT_PATH,
      { timeout: 15000 },
    );
    const onThankYou = page.url().includes("/tack");
    if (onThankYou) {
      await expect(page.getByRole("heading", { name: "Tack" })).toBeVisible();
    } else {
      await expect(page.locator(".bg-red-200, [class*='red']")).toBeVisible();
    }
  });

  test("thank-you without valid token redirects to shop", async ({ page }) => {
    await page.goto(THANK_YOU_PATH);
    await expect(page).toHaveURL(/\/bestall\/?$/);
    await page.goto(`${THANK_YOU_PATH}?orderId=123&token=invalid`);
    await expect(page).toHaveURL(/\/bestall\/?$/);
  });

  test("header cart link goes to cart", async ({ page }) => {
    await page.goto(SHOP_BASE);
    await page.getByRole("link", { name: "Visa kundvagn" }).first().click();
    await expect(page).toHaveURL(CART_PATH);
  });
});
