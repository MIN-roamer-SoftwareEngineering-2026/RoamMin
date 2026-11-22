import { expect, test } from "@playwright/test";
import { env, requireAccounts } from "./env";
import { closeRole, openRole, type RoleSession } from "./fixtures";
import { sel } from "./selectors";

/**
 * Alpha main flow (B group, 邹佳妤):
 *
 *   account A signs in -> creates the Fuzhou sample trip -> sees it in "My trips"
 *   -> searches account B -> invites B
 *   -> account B signs in -> sees the trip in "Joined trips"
 *
 * Requires: Spring Boot on :8080 and two seeded accounts in frontend/.env.e2e.
 */
test("owner creates a Fuzhou trip, invites B, B sees the joined trip", async (
  { browser },
  testInfo,
) => {
  requireAccounts();

  // Unique per run: there is no delete-trip API, so titles accumulate in the
  // H2 database and minute-level stamps would collide across quick reruns.
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
  const title = `${env.trip.prefix} ${stamp}-${Math.floor(Math.random() * 1000)}`;

  let owner: RoleSession | undefined;
  let member: RoleSession | undefined;

  try {
    owner = await openRole(browser, "owner");
    member = await openRole(browser, "member");

    // 1. Account A: create the trip from My home.
    await owner.page.goto("/my");
    await expect(owner.page.locator(sel.myHome.createDisclosure)).toBeVisible();
    await owner.page.locator(sel.myHome.createDisclosure).click();

    await owner.page.locator(sel.myHome.tripName).fill(title);
    await owner.page.locator(sel.myHome.destination).fill(env.trip.destination);
    const dates = owner.page.locator(sel.myHome.dateInputs);
    await dates.nth(0).fill(env.trip.start);
    await dates.nth(1).fill(env.trip.end);
    await owner.page.locator(sel.myHome.createSubmit).click();

    const ownerCard = owner.page
      .locator(sel.myHome.tripCard, { hasText: title })
      .first();
    await expect(ownerCard).toBeVisible({ timeout: 20_000 });

    // 2. Account A: search B and invite them.
    await ownerCard.getByRole("button", { name: sel.invite.openButton }).click();
    await owner.page.locator(sel.invite.search).fill(env.member.username);

    const resultRow = owner.page.locator(sel.invite.resultRow, {
      hasText: `@${env.member.username}`,
    });
    await expect(resultRow).toBeVisible({ timeout: 20_000 });
    await resultRow.getByRole("button", { name: sel.invite.inviteButton }).click();
    await expect(owner.page.locator(sel.invite.memberList)).toContainText(
      env.member.username,
      { timeout: 20_000 },
    );

    // 3. Account B: the trip shows up under "Joined trips".
    await member.page.goto("/my");
    await member.page.locator(sel.myHome.joinedTab).click();
    await expect(member.page.getByText(title).first()).toBeVisible({
      timeout: 20_000,
    });

    // Deliverable evidence for the Issue / test report.
    await owner.page.screenshot({
      path: testInfo.outputPath("01-owner-trip-card.png"),
      fullPage: true,
    });
    await member.page.screenshot({
      path: testInfo.outputPath("02-member-joined-trip.png"),
      fullPage: true,
    });

  } finally {
    if (member) await closeRole(member);
    if (owner) await closeRole(owner);
  }
});
