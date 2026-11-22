export const env = {
  baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173",
  owner: {
    email: process.env.E2E_OWNER_EMAIL ?? "",
    password: process.env.E2E_OWNER_PASSWORD ?? "",
  },
  member: {
    email: process.env.E2E_MEMBER_EMAIL ?? "",
    password: process.env.E2E_MEMBER_PASSWORD ?? "",
    username: process.env.E2E_MEMBER_USERNAME ?? "",
  },
  trip: {
    prefix: process.env.E2E_TRIP_PREFIX ?? "Alpha E2E",
    destination: process.env.E2E_TRIP_DESTINATION ?? "Fuzhou",
    start: process.env.E2E_TRIP_START ?? "2026-11-28",
    end: process.env.E2E_TRIP_END ?? "2026-11-29",
  },
};

/** Fail fast with an actionable message instead of a confusing timeout. */
export function requireAccounts() {
  const missing = [
    ["E2E_OWNER_EMAIL", env.owner.email],
    ["E2E_OWNER_PASSWORD", env.owner.password],
    ["E2E_MEMBER_EMAIL", env.member.email],
    ["E2E_MEMBER_PASSWORD", env.member.password],
    ["E2E_MEMBER_USERNAME", env.member.username],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      [
        `Missing E2E account settings: ${missing.join(", ")}`,
        "Copy frontend/.env.e2e.example to frontend/.env.e2e and fill in the two",
        "Alpha test accounts (owner = account A, member = account B), then rerun.",
      ].join("\n"),
    );
  }
}
