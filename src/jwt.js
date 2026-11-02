import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./validation.js";

const issuer = process.env.BETTER_AUTH_URL;
const audience = process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL;
const secret = process.env.JWT_SECRET;
const tokenLifetimeSeconds = 15 * 60;

if (!secret || secret.length < 32) {
  throw new Error("JWT_SECRET is required and must be at least 32 characters.");
}

if (!issuer || !audience) {
  throw new Error("BETTER_AUTH_URL and CLIENT_ORIGIN are required to configure JWT validation.");
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signature(input) {
  return createHmac("sha256", secret).update(input).digest();
}

export function issueAccessToken(user, now = Math.floor(Date.now() / 1000)) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: user.id,
    email: user.email,
    name: user.name,
    iss: issuer,
    aud: audience,
    iat: now,
    exp: now + tokenLifetimeSeconds,
  });
  const input = `${header}.${payload}`;
  return {
    token: `${input}.${signature(input).toString("base64url")}`,
    tokenType: "Bearer",
    expiresIn: tokenLifetimeSeconds,
  };
}

export function verifyAccessToken(token, now = Math.floor(Date.now() / 1000)) {
  if (typeof token !== "string" || token.length > 8192) {
    throw new ApiError(401, "A valid Bearer token is required.");
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new ApiError(401, "A valid Bearer token is required.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header;
  let payload;
  let suppliedSignature;
  try {
    header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    suppliedSignature = Buffer.from(encodedSignature, "base64url");
  } catch {
    throw new ApiError(401, "A valid Bearer token is required.");
  }

  if (
    !header ||
    header.alg !== "HS256" ||
    header.typ !== "JWT" ||
    !payload ||
    typeof payload !== "object"
  ) {
    throw new ApiError(401, "A valid Bearer token is required.");
  }

  const expectedSignature = signature(`${encodedHeader}.${encodedPayload}`);
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    throw new ApiError(401, "A valid Bearer token is required.");
  }

  if (
    payload.iss !== issuer ||
    payload.aud !== audience ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    !Number.isInteger(payload.iat) ||
    !Number.isInteger(payload.exp) ||
    payload.iat > now ||
    payload.exp <= now ||
    payload.exp <= payload.iat
  ) {
    throw new ApiError(401, "The Bearer token is invalid or expired.");
  }

  return { id: payload.sub, email: payload.email, name: payload.name };
}

export function requireAccessToken(request, response, next) {
  const authorization = request.get("authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    response.status(401).json({ message: "A valid Bearer token is required." });
    return;
  }

  try {
    request.authUser = verifyAccessToken(match[1]);
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      response.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}
