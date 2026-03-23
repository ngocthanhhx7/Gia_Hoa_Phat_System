import {
  test,
  expect,
  request,
  type Browser,
  type BrowserContext,
} from "@playwright/test";

const accounts = {
  admin: {
    email: "admin@giahoophat.vn",
    password: "Admin@2024",
  },
  staff: {
    email: "nhanvien@giahoophat.vn",
    password: "Staff@2024",
  },
  customer: {
    email: "khachhang@gmail.com",
    password: "Customer@2024",
  },
  delivery: {
    email: "giaohang@giahoophat.vn",
    password: "Delivery@2024",
  },
} as const;

const deliveryName = "Lê Văn Giao - giaohang@giahoophat.vn";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";

async function openSession(browser: Browser, email: string, password: string) {
  const api = await request.newContext({ baseURL });

  const csrfResponse = await api.get("/api/auth/csrf");
  expect(csrfResponse.ok()).toBeTruthy();
  const { csrfToken } = await csrfResponse.json();

  const loginResponse = await api.post("/api/auth/callback/credentials?json=true", {
    form: {
      csrfToken,
      email,
      password,
      callbackUrl: "/",
      redirect: "false",
      json: "true",
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const sessionResponse = await api.get("/api/auth/session");
  expect(sessionResponse.ok()).toBeTruthy();
  const session = await sessionResponse.json();
  expect(session?.user?.email).toBe(email);

  const storageState = await api.storageState();
  await api.dispose();

  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  await page.goto("/");
  await expect.poll(async () => {
    const browserSession = await page.evaluate(async () => {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });
      return response.json();
    });
    return browserSession?.user?.email || null;
  }).toBe(email);
  return { context, page };
}

async function clearCart(context: BrowserContext) {
  const response = await context.request.delete("/api/cart");
  expect(response.ok() || response.status() === 404).toBeTruthy();
}

async function getDeliveredOrder(context: BrowserContext) {
  const response = await context.request.get("/api/orders/my?status=DELIVERED&limit=10");
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect((data.orders || []).length).toBeGreaterThan(0);
  return data.orders[0] as { id: string; code: string };
}

async function createOrder(browser: Browser) {
  const { context, page } = await openSession(
    browser,
    accounts.customer.email,
    accounts.customer.password
  );

  await clearCart(context);

  await page.goto("/products");
  const firstProduct = page.locator('[data-testid^="product-card-"]').first();
  await firstProduct.click();
  await expect(page.getByTestId("add-to-cart")).toBeVisible();
  const productId = page.url().split("/").pop() || "";
  await page.getByTestId("add-to-cart").click();

  const cartStateResponse = await context.request.get("/api/cart");
  expect(cartStateResponse.ok()).toBeTruthy();
  const cartState = await cartStateResponse.json();
  if (!cartState.totalItems) {
    const addFallbackResponse = await context.request.post("/api/cart", {
      data: { productId, quantity: 1 },
    });
    expect(addFallbackResponse.ok()).toBeTruthy();
  }

  await page.goto("/cart");
  await page.getByTestId("proceed-to-checkout").click();
  await page.getByTestId("voucher-code").fill("WELCOME10");
  await page.getByTestId("apply-voucher").click();
  await expect(page.locator("body")).toContainText("Giảm 10% cho khách hàng mới");
  await page.getByTestId("checkout-address").fill("456 Đường Playwright, Quận 10, TP.HCM");
  await page.getByTestId("checkout-phone").fill("0900001234");
  await page.getByTestId("place-order").click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Đặt hàng thành công");
  await page.getByRole("button", { name: "Xem đơn hàng" }).click();
  await expect(page).toHaveURL(/\/orders\/[^/]+$/);

  const orderId = page.url().split("/").pop() || "";
  const heading = await page.getByRole("heading", { level: 1 }).textContent();
  const orderCodeMatch = heading?.match(/GHP-[\d-]+/);
  const orderCode = orderCodeMatch?.[0] || "";

  expect(orderId).not.toBe("");
  expect(orderCode).not.toBe("");
  return { context, page, orderId, orderCode };
}

test("admin credentials login works", async ({ browser }) => {
  const adminRun = await openSession(browser, accounts.admin.email, accounts.admin.password);
  await adminRun.page.goto("/admin/dashboard");
  await expect(adminRun.page).toHaveURL(/\/admin\/dashboard$/);
  await adminRun.context.close();
});

test("customer credentials login works", async ({ browser }) => {
  const customerRun = await openSession(browser, accounts.customer.email, accounts.customer.password);
  await customerRun.page.goto("/products");
  await expect(customerRun.page).toHaveURL(/\/products/);
  await expect(customerRun.page.locator("body")).toContainText("Sản phẩm");
  await customerRun.context.close();
});

test("delivery credentials login works", async ({ browser }) => {
  const deliveryRun = await openSession(browser, accounts.delivery.email, accounts.delivery.password);
  await deliveryRun.page.goto("/delivery");
  await expect(deliveryRun.page).toHaveURL(/\/delivery$/);
  await deliveryRun.context.close();
});

test("customer checkout, staff assign, delivery completes, customer sees delivered", async ({ browser }) => {
  const customerRun = await createOrder(browser);

  const staffRun = await openSession(browser, accounts.staff.email, accounts.staff.password);
  const { context: staffContext, page: staffPage } = staffRun;

  const confirmResponse = await staffContext.request.put(`/api/orders/${customerRun.orderId}`, {
    data: { status: "CONFIRMED" },
  });
  expect(confirmResponse.ok()).toBeTruthy();

  const processingResponse = await staffContext.request.put(`/api/orders/${customerRun.orderId}`, {
    data: { status: "PROCESSING" },
  });
  expect(processingResponse.ok()).toBeTruthy();

  await staffPage.goto("/admin/orders");
  await expect(staffPage.getByTestId(`assign-delivery-${customerRun.orderCode}`)).toBeVisible();
  await staffPage.getByTestId(`assign-delivery-${customerRun.orderCode}`).selectOption({
    label: deliveryName,
  });
  await staffPage.getByTestId(`assign-carrier-${customerRun.orderCode}`).fill("Giao Hàng Nhanh");
  await staffPage.getByTestId(`assign-tracking-${customerRun.orderCode}`).fill(`PW-${Date.now()}`);
  await staffPage.getByTestId(`save-delivery-${customerRun.orderCode}`).click();
  await expect(staffPage.locator("body")).toContainText("Đã cập nhật thông tin giao hàng");

  const deliveryRun = await openSession(browser, accounts.delivery.email, accounts.delivery.password);
  await deliveryRun.page.goto(`/delivery/${customerRun.orderId}`);
  await deliveryRun.page.getByTestId("delivery-start").click();
  await expect(deliveryRun.page.getByTestId("delivery-complete")).toBeVisible();
  await deliveryRun.page.getByTestId("delivery-complete").click();
  await expect(deliveryRun.page.locator("body")).toContainText("DELIVERED");

  await customerRun.page.goto(`/orders/${customerRun.orderId}`);
  await expect(customerRun.page.getByTestId("order-status")).toContainText("Đã giao");

  await deliveryRun.context.close();
  await staffRun.context.close();
  await customerRun.context.close();
});

test("customer can view purchase history and tracking timeline", async ({ browser }) => {
  const customerRun = await openSession(browser, accounts.customer.email, accounts.customer.password);
  await customerRun.page.goto("/orders");
  await expect(customerRun.page.locator("body")).toContainText("Lịch sử mua hàng");
  await expect(customerRun.page.locator("body")).toContainText("GHP-20260320-101");

  const deliveredOrder = await getDeliveredOrder(customerRun.context);
  await customerRun.page.goto(`/orders/${deliveredOrder.id}?tab=tracking`);
  await expect(customerRun.page.locator("body")).toContainText("Timeline đơn hàng");
  await expect(customerRun.page.locator("body")).toContainText("Đang giao hàng");

  await customerRun.context.close();
});

test("customer can submit feedback for delivered order and review appears on product detail", async ({ browser }) => {
  const customerRun = await openSession(browser, accounts.customer.email, accounts.customer.password);
  const deliveredOrder = await getDeliveredOrder(customerRun.context);

  const orderResponse = await customerRun.context.request.get(`/api/orders/${deliveredOrder.id}`);
  expect(orderResponse.ok()).toBeTruthy();
  const orderData = await orderResponse.json();
  const reviewableItem = (orderData.feedbackEligibleItems || []).find((item: { canReview: boolean }) => item.canReview);
  expect(reviewableItem).toBeTruthy();

  const comment = `Đánh giá Playwright ${Date.now()}`;
  await customerRun.page.goto(`/orders/${deliveredOrder.id}`);
  await customerRun.page.getByTestId("order-tab-feedback").click();
  await customerRun.page.locator("textarea").first().fill(comment);
  await customerRun.page.getByRole("button", { name: "Gửi đánh giá" }).first().click();
  await expect(customerRun.page.locator("body")).toContainText("Đã gửi đánh giá thành công");

  await customerRun.page.goto(`/products/${reviewableItem.productId}`);
  await expect(customerRun.page.locator("body")).toContainText(comment);

  await customerRun.context.close();
});

test("customer creates support ticket, staff sees it, and chatbot answers FAQ", async ({ browser }) => {
  const customerRun = await openSession(browser, accounts.customer.email, accounts.customer.password);
  const uniqueSubject = `Playwright support ${Date.now()}`;

  await customerRun.page.goto("/support");
  await customerRun.page.getByPlaceholder("Chủ đề cần hỗ trợ").fill(uniqueSubject);
  await customerRun.page.getByRole("combobox").first().selectOption("ORDER");
  await customerRun.page.getByPlaceholder("Mô tả chi tiết vấn đề bạn đang gặp").fill("Mình cần staff hỗ trợ kiểm tra trạng thái xử lý đơn hàng.");
  await customerRun.page.getByRole("button", { name: "Gửi yêu cầu hỗ trợ" }).click();
  await expect(customerRun.page.locator("body")).toContainText("Đã gửi ticket hỗ trợ");
  await expect(customerRun.page.locator("body")).toContainText(uniqueSubject);

  await customerRun.page.goto("/support/assistant");
  await customerRun.page.getByPlaceholder("Ví dụ: Tôi xem lịch sử đơn ở đâu?").fill("Tôi xem lịch sử đơn ở đâu?");
  await customerRun.page.getByRole("button", { name: "Gửi câu hỏi" }).click();
  await expect(customerRun.page.locator("body")).toContainText("Đơn hàng");

  const staffRun = await openSession(browser, accounts.staff.email, accounts.staff.password);
  await staffRun.page.goto("/admin/support");
  await expect(staffRun.page.locator("body")).toContainText(uniqueSubject);
  await staffRun.page.getByRole("link", { name: uniqueSubject }).click();
  await expect(staffRun.page.locator("body")).toContainText("Mình cần staff hỗ trợ kiểm tra trạng thái xử lý đơn hàng.");

  await staffRun.context.close();
  await customerRun.context.close();
});
