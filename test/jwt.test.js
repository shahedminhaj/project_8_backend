import assert from "node:assert/strict";
import test from "node:test";

process.env.JWT_SECRET = "test-jwt-secret-that-is-at-least-32-characters-long";
process.env.BETTER_AUTH_URL = "http://localhost:5000";
process.env.CLIENT_ORIGIN = "http://localhost:3000";

const { issueAccessToken, verifyAccessToken } = await import("../src/jwt.js");

const user = { id: "user-123", email: "neighbor@example.com", name: "Good Neighbor" };

test("issues a short-lived access token and validates its user claims", () => {
  const issued = issueAccessToken(user, 1_800_000_000);
  assert.equal(issued.tokenType, "Bearer");
  assert.equal(issued.expiresIn, 900);
  assert.deepEqual(verifyAccessToken(issued.token, 1_800_000_001), user);
});

test("rejects malformed, modified, and expired access tokens", () => {
  const issued = issueAccessToken(user, 1_800_000_000);
  const modified = `${issued.token.slice(0, -1)}x`;

  assert.throws(() => verifyAccessToken("not-a-jwt"), { status: 401 });
  assert.throws(() => verifyAccessToken(modified, 1_800_000_001), { status: 401 });
  assert.throws(() => verifyAccessToken(issued.token, 1_800_000_900), { status: 401 });
});
