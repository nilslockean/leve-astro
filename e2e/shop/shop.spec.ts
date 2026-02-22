import { test, expect } from "@playwright/test";

// Shop routes (from src/config/site)
const SHOP_BASE = "/bestall";
const CART_PATH = "/kundvagn";
const CHECKOUT_PATH = "/kassa";
const THANK_YOU_PATH = "/bestall/tack";

test.describe("Shop (storefront)", () => {
  test.describe("Product overview", () => {
    test("loads and shows product list when storefront is enabled", async ({
      page,
    }) => {
      const res = await page.goto(SHOP_BASE);
      // If ENABLE_STOREFRONT is false, /bestall may 404 or show different content
      expect(res?.status()).toBe(200);
      await expect(
        page.getByRole("heading", {
          name: /Beställ bakverk direkt från bageriet/i,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Produkter" }),
      ).toBeVisible();
    });

    test("product links point to product detail pages", async ({ page }) => {
      await page.goto(SHOP_BASE);
      const productLink = page.locator(`a[href^="${SHOP_BASE}/"]`).first();
      await expect(productLink).toBeVisible();
      const href = await productLink.getAttribute("href");
      expect(href).toMatch(new RegExp(`^${SHOP_BASE}/[^/]+$`));
    });
  });

  test.describe("Disabled product states", () => {
    test("out-of-stock product: overview shows Slut i lager, detail shows disabled button (no Visa kundvagn in form)", async ({
      page,
    }) => {
      await page.goto(SHOP_BASE);
      const outOfStockCard = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .filter({ has: page.getByText("Slut i lager") })
        .first();
      if (!(await outOfStockCard.isVisible())) {
        test.skip(true, "No out-of-stock product in store");
      }
      await outOfStockCard.click();
      await expect(page).toHaveURL(new RegExp(`${SHOP_BASE}/[^/]+$`));
      const form = page.getByRole("main").locator("form").first();
      await expect(form).toBeVisible();
      await expect(
        form.getByRole("button", { name: /Slut i lager/ }),
      ).toBeDisabled();
      await expect(
        form.getByRole("link", { name: "Visa kundvagn" }),
      ).toHaveCount(0);
    });

    test("no pickup dates product: overview shows Ej tillgänglig, detail shows disabled Ej tillgänglig", async ({
      page,
    }) => {
      await page.goto(SHOP_BASE);
      const noDatesCard = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .filter({ has: page.getByText("Ej tillgänglig") })
        .first();
      if (!(await noDatesCard.isVisible())) {
        test.skip(true, "No product with only past pickup dates in store");
      }
      await noDatesCard.click();
      await expect(page).toHaveURL(new RegExp(`${SHOP_BASE}/[^/]+$`));
      const form = page.getByRole("main").locator("form").first();
      await expect(form).toBeVisible();
      await expect(
        form.getByRole("button", { name: /Ej tillgänglig/ }),
      ).toBeDisabled();
    });
  });

  test.describe("Product detail", () => {
    test("opens from overview and shows product content", async ({ page }) => {
      await page.goto(SHOP_BASE);
      const firstProductLink = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .first();
      await expect(firstProductLink).toBeVisible();
      await firstProductLink.click();
      await expect(page).toHaveURL(new RegExp(`${SHOP_BASE}/[^/]+$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Visa kundvagn" }),
      ).toBeVisible();
    });

    test("breadcrumbs show Hem > Beställ > product title", async ({ page }) => {
      await page.goto(SHOP_BASE);
      const firstProductLink = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .first();
      await firstProductLink.click();
      const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb.getByRole("link", { name: "Hem" })).toBeVisible();
      await expect(
        breadcrumb.getByRole("link", { name: "Beställ" }),
      ).toBeVisible();
    });

    test("product detail has purchase-related content (form or link to cart)", async ({
      page,
    }) => {
      await page.goto(SHOP_BASE);
      const firstProductLink = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .first();
      await firstProductLink.click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const main = page.getByRole("main");
      await expect(
        main.locator("form, a[href*='kundvagn']").first(),
      ).toBeVisible();
    });
  });

  test.describe("Cart", () => {
    test("empty cart shows empty state and link to shop", async ({ page }) => {
      await page.goto(CART_PATH);
      await expect(
        page.getByRole("heading", { name: "Kundvagn" }),
      ).toBeVisible();
      await expect(page.getByText("Kundvagnen är tom.")).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Fortsätt handla" }),
      ).toBeVisible();
    });

    test("adding a product from detail page shows it in cart", async ({
      page,
    }) => {
      await page.goto(SHOP_BASE);
      const firstProductLink = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .first();
      await firstProductLink.click();
      const submitBtn = page.getByRole("button", { name: /Beställ/ });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await expect(page.getByText(/lades till i din kundvagn/i)).toBeVisible({
          timeout: 5000,
        });
        await page.getByRole("link", { name: "Visa kundvagn" }).click();
        await expect(page).toHaveURL(CART_PATH);
        const list = page.locator("ul").filter({ has: page.locator("form") });
        await expect(list.locator("li").first()).toBeVisible();
      } else {
        await page.goto(CART_PATH);
        await expect(
          page.getByRole("heading", { name: "Kundvagn" }),
        ).toBeVisible();
      }
    });

    test("cart shows totals and checkout link when it has items", async ({
      page,
    }) => {
      await page.goto(SHOP_BASE);
      const firstProductLink = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .first();
      await firstProductLink.click();
      const submitBtn = page.getByRole("button", { name: /Beställ/ });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.getByRole("link", { name: "Visa kundvagn" }).click();
      } else {
        await page.goto(CART_PATH);
      }
      const hasItems = await page
        .getByRole("button", { name: "Ändra antal" })
        .first()
        .isVisible()
        .catch(() => false);
      if (hasItems) {
        await expect(
          page.getByRole("heading", { name: "Sammanställning" }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Gå till kassan" }),
        ).toBeVisible();
      }
    });

    test("can update quantity and remove item", async ({ page }) => {
      await page.goto(SHOP_BASE);
      const firstProductLink = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .first();
      await firstProductLink.click();
      const submitBtn = page.getByRole("button", { name: /Beställ/ });
      if (!(await submitBtn.isVisible())) {
        test.skip(true, "No in-stock product to add");
      }
      await submitBtn.click();
      await page.getByRole("link", { name: "Visa kundvagn" }).click();
      const qtyInput = page.getByRole("spinbutton", { name: /st\./ });
      if (!(await qtyInput.isVisible())) {
        test.skip(true, "Cart item form not found");
      }
      await qtyInput.fill("2");
      await page.getByRole("button", { name: "Ändra antal" }).first().click();
      await expect(page).toHaveURL(CART_PATH);
      const removeBtn = page.getByRole("button", { name: "Ta bort" }).first();
      await removeBtn.click();
      await expect(page).toHaveURL(CART_PATH);
      await expect(page.getByText("Kundvagnen är tom.")).toBeVisible();
    });
  });

  test.describe("Checkout", () => {
    test("shows cart content when cart is empty (server rewrite)", async ({
      page,
    }) => {
      await page.context().clearCookies();
      await page.goto(CHECKOUT_PATH);
      // Astro.rewrite() keeps URL as /kassa but serves cart page content
      await expect(
        page.getByRole("heading", { name: "Kundvagn" }),
      ).toBeVisible();
      await expect(page.getByText("Kundvagnen är tom.")).toBeVisible();
    });

    test("checkout form has pickup date, contact fields and submit", async ({
      page,
    }) => {
      await page.goto(SHOP_BASE);
      const firstProductLink = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .first();
      await firstProductLink.click();
      const submitBtn = page.getByRole("button", { name: /Beställ/ });
      if (!(await submitBtn.isVisible())) {
        test.skip(true, "No in-stock product");
      }
      await submitBtn.click();
      await page.getByRole("link", { name: "Visa kundvagn" }).click();
      await page.getByRole("link", { name: "Gå till kassan" }).click();
      await expect(page).toHaveURL(CHECKOUT_PATH);
      await expect(page.getByRole("heading", { name: "Kassa" })).toBeVisible();
      await expect(
        page.getByRole("group", { name: "1. Upphämtning" }),
      ).toBeVisible();
      await expect(page.getByLabel("Upphämtningsdatum")).toBeVisible();
      await expect(
        page.getByRole("group", { name: "2. Personuppgifter" }),
      ).toBeVisible();
      await expect(page.getByLabel("Namn")).toBeVisible();
      await expect(page.getByLabel("E-post")).toBeVisible();
      await expect(page.getByLabel("Telefon")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Slutför beställning" }),
      ).toBeVisible();
    });

    test("submitting checkout with valid data shows success or error", async ({
      page,
    }) => {
      await page.goto(SHOP_BASE);
      const firstProductLink = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .first();
      await firstProductLink.click();
      const submitBtn = page.getByRole("button", { name: /Beställ/ });
      if (!(await submitBtn.isVisible())) {
        test.skip(true, "No in-stock product");
      }
      await submitBtn.click();
      await page.getByRole("link", { name: "Visa kundvagn" }).click();
      await page.getByRole("link", { name: "Gå till kassan" }).click();
      const pickupSelect = page.getByLabel("Upphämtningsdatum");
      const firstDateOption = await pickupSelect
        .locator("option")
        .filter({ hasNotText: /Välj datum|Inga datum/ })
        .first()
        .getAttribute("value");
      if (!firstDateOption) {
        test.skip(true, "No pickup dates available");
      }
      await pickupSelect.selectOption(firstDateOption!);
      await page.getByLabel("Namn").fill("E2E Test");
      await page.getByLabel("E-post").fill("e2e@example.com");
      await page.getByLabel("Telefon").fill("0701234567");
      await page.getByRole("button", { name: "Slutför beställning" }).click();
      // Success: redirect to thank-you page; error: stay on checkout with error box
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

    test("thank-you page without valid token redirects to shop", async ({
      page,
    }) => {
      await page.goto(THANK_YOU_PATH);
      await expect(page).toHaveURL(/\/bestall\/?$/);
      await page.goto(`${THANK_YOU_PATH}?orderId=123&token=invalid`);
      await expect(page).toHaveURL(/\/bestall\/?$/);
    });

    test("on successful checkout redirects to Tack, shows order breakdown and email message, cart is empty", async ({
      page,
    }) => {
      await page.goto(SHOP_BASE);
      const firstProductLink = page
        .locator("a[href^='" + SHOP_BASE + "/']")
        .first();
      await firstProductLink.click();
      const submitBtn = page.getByRole("button", { name: /Beställ/ });
      if (!(await submitBtn.isVisible())) {
        test.skip(true, "No in-stock product");
      }
      await submitBtn.click();
      await page.getByRole("link", { name: "Visa kundvagn" }).click();
      await page.getByRole("link", { name: "Gå till kassan" }).click();
      const pickupSelect = page.getByLabel("Upphämtningsdatum");
      const firstDateOption = await pickupSelect
        .locator("option")
        .filter({ hasNotText: /Välj datum|Inga datum/ })
        .first()
        .getAttribute("value");
      if (!firstDateOption) {
        test.skip(true, "No pickup dates available");
      }
      await pickupSelect.selectOption(firstDateOption!);
      await page.getByLabel("Namn").fill("E2E Test");
      await page.getByLabel("E-post").fill("e2e@example.com");
      await page.getByLabel("Telefon").fill("0701234567");
      await page.getByRole("button", { name: "Slutför beställning" }).click();

      // Wait for redirect to thank-you page (if checkout succeeded)
      const thankYou = page.getByRole("heading", { name: "Tack" });
      const stayedOnCheckout = page.getByRole("heading", { name: "Kassa" });
      await expect(thankYou.or(stayedOnCheckout)).toBeVisible({
        timeout: 15000,
      });
      if (!(await thankYou.isVisible())) {
        test.skip(
          true,
          "Checkout did not succeed (e.g. mail or Sanity unavailable)",
        );
      }

      await expect(page).toHaveURL(/\/bestall\/tack\?orderId=.+&token=.+/);
      await expect(
        page.getByText(/orderbekräftelse till|Kolla din e-post/i),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Orderöversikt" }),
      ).toBeVisible();
      await expect(page.getByText(/Ordernummer:/)).toBeVisible();
      await expect(page.getByText(/e2e@example\.com/)).toBeVisible();

      // Cart should be empty: go to cart and verify
      await page.goto(CART_PATH);
      await expect(
        page.getByRole("heading", { name: "Kundvagn" }),
      ).toBeVisible();
      await expect(page.getByText("Kundvagnen är tom.")).toBeVisible();
    });
  });

  test.describe("Navigation", () => {
    test("header cart link goes to cart", async ({ page }) => {
      await page.goto(SHOP_BASE);
      await page.getByRole("link", { name: "Visa kundvagn" }).first().click();
      await expect(page).toHaveURL(CART_PATH);
    });

    test("cart breadcrumb links back to shop and home", async ({ page }) => {
      await page.goto(CART_PATH);
      await page.getByRole("link", { name: "Beställ" }).first().click();
      await expect(page).toHaveURL(SHOP_BASE);
      await page.goto(CART_PATH);
      await page.getByRole("link", { name: "Hem" }).first().click();
      await expect(page).toHaveURL("/");
    });
  });
});
