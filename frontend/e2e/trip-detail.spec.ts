import { expect, test } from "@playwright/test";
import { env, requireAccounts } from "./env";
import { closeRole, openRole, readSession } from "./fixtures";

test("trip detail supports navigation, refresh, members, expenses and both languages", async ({
  browser,
  request,
}, testInfo) => {
  requireAccounts();
  const owner = await openRole(browser, "owner", {
    viewport: { width: 1440, height: 960 },
  });
  const member = await openRole(browser, "member");
  const headers = { Authorization: `Bearer ${readSession("owner").token}` };
  const title = `Fuzhou detail ${Date.now()}`;
  try {
    const created = await request.post(`${env.apiBase}/trips`, {
      headers,
      data: {
        title,
        destination: "Fuzhou",
        startDate: "2026-11-28",
        endDate: "2026-11-29",
      },
    });
    expect(created.ok()).toBeTruthy();
    const { data: trip } = await created.json();
    const detailPath = `/trips/${trip.id}`;

    // Before invitation the other account cannot view the workspace.
    await member.page.goto(`${env.baseURL}${detailPath}`);
    await expect(member.page.getByRole("alert")).toContainText(
      "This trip does not exist or you do not have access.",
    );

    const invitation = await request.post(
      `${env.apiBase}${detailPath}/members`,
      { headers, data: { username: env.member.username } },
    );
    expect(invitation.ok()).toBeTruthy();

    await owner.page.goto(`${env.baseURL}/trips`);
    await owner.page.getByRole("link", { name: new RegExp(title) }).click();
    await expect(owner.page).toHaveURL(`${env.baseURL}${detailPath}`);
    const detail = owner.page.locator(".trip-detail-page");
    await expect(detail.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(detail.locator(".trip-detail-facts")).toContainText("Fuzhou");
    await expect(detail.locator(".trip-detail-facts")).toContainText(
      "2026-11-28",
    );
    await expect(detail.locator(".trip-detail-facts")).toContainText(
      "2026-11-29",
    );
    await expect(
      detail.getByRole("region", { name: "Trip members · 2" }),
    ).toBeVisible();
    await expect(detail.getByRole("region", { name: "Places" })).toBeVisible();
    await expect(
      detail.getByRole("region", { name: "Expenses", exact: true }),
    ).toBeVisible();

    await detail
      .getByRole("button", { name: "Trip expenses", exact: true })
      .click();
    await expect(detail.getByRole("dialog")).toBeVisible();
    await detail.getByRole("button", { name: "Close trip expenses" }).click();

    await owner.page.reload();
    await expect(detail.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(detail.locator(".trip-detail-facts dd").last()).toHaveText(
      "2",
    );
    await member.page.reload();
    await expect(
      member.page.getByRole("heading", { name: title }),
    ).toBeVisible();

    await owner.page.getByRole("button", { name: "中", exact: true }).click();
    await expect(detail.getByRole("heading", { name: "地点" })).toBeVisible();
    await expect(detail.getByRole("heading", { name: "费用" })).toBeVisible();
    await expect(
      detail.getByRole("heading", { name: "行程成员 · 2" }),
    ).toBeVisible();
    await owner.page.screenshot({
      path: testInfo.outputPath("01-trip-detail.png"),
      fullPage: true,
    });

    await owner.page.goto(`${env.baseURL}/trips/9007199254740991`);
    await expect(owner.page.getByRole("alert")).toContainText(
      "This trip does not exist or you do not have access.",
    );
    await owner.page.getByRole("button", { name: "中", exact: true }).click();
    await expect(owner.page.getByRole("alert")).toContainText(
      "该行程不存在，或你没有访问权限。",
    );
    await owner.page.screenshot({
      path: testInfo.outputPath("02-trip-unavailable.png"),
      fullPage: true,
    });
    await owner.page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(owner.page.getByRole("alert")).toContainText(
      "This trip does not exist or you do not have access.",
    );
    await owner.page.goto(`${env.baseURL}/trips/invalid-id`);
    await expect(owner.page.getByRole("alert")).toContainText(
      "This trip does not exist or you do not have access.",
    );
    await owner.page.getByRole("link", { name: "Back to my trips" }).click();
    await expect(owner.page).toHaveURL(`${env.baseURL}/trips`);
  } finally {
    await closeRole(owner);
    await closeRole(member);
  }
});
