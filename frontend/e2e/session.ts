import path from "node:path";

export type Role = "owner" | "member";
export type StoredSession = { token: string; email: string };

/** Everything under e2e/.auth is generated at runtime and git-ignored. */
export const AUTH_DIR = path.resolve("e2e/.auth");

export function sessionPath(role: Role) {
  return path.join(AUTH_DIR, `${role}.token.json`);
}

export function storageStatePath(role: Role) {
  return path.join(AUTH_DIR, `${role}.json`);
}
