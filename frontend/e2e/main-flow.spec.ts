import { expect, test } from "@playwright/test";
import { env, requireAccounts } from "./env";
import { closeRole, openRole, readSession, type RoleSession } from "./fixtures";
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
  { browser, request },
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

    // TC-06: the created trip survives a full page reload.
    await owner.page.reload({ waitUntil: "domcontentloaded" });
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

    // TC-07: inviting the same member again must be blocked, not duplicated.
    await owner.page.locator(sel.invite.search).fill(env.member.username);
    const existingRow = owner.page
      .locator(sel.invite.resultRow, { hasText: `@${env.member.username}` })
      .first();
    await expect(existingRow).toBeVisible({ timeout: 20_000 });
    const existingButton = existingRow.getByRole("button");
    await expect(existingButton).toBeDisabled();
    await expect(existingButton).toHaveText(/已加入|Joined/);
    await expect(
      owner.page.locator(`${sel.invite.memberList} li`, {
        hasText: `@${env.member.username}`,
      }),
    ).toHaveCount(1);
    await owner.page.locator(sel.invite.search).fill("");

    // TC-08: a trip member must not be able to invite anyone else (403).
    const ownerSession = readSession("owner");
    const memberSession = readSession("member");
    const ownerTrips = await request.get(`${env.apiBase}/trips/mine`, {
      headers: { Authorization: `Bearer ${ownerSession.token}` },
    });
    const tripsBody = (await ownerTrips.json()) as {
      data?: Array<{ id: number; title: string }>;
    };
    const createdTrip = tripsBody.data?.find((trip) => trip.title === title);
    expect(createdTrip, "created trip should appear in /trips/mine").toBeTruthy();

    const ownerMe = await request.get(`${env.apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${ownerSession.token}` },
    });
    const ownerName = ((await ownerMe.json()) as {
      data?: { username?: string };
    }).data?.username;

    const forbidden = await request.post(
      `${env.apiBase}/trips/${createdTrip!.id}/members`,
      {
        headers: { Authorization: `Bearer ${memberSession.token}` },
        data: { username: ownerName },
      },
    );
    expect(
      forbidden.status(),
      "a member inviting another user must be rejected",
    ).toBe(403);

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
