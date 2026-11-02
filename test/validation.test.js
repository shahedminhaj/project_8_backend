import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, eventInput } from "../src/validation.js";

function validEvent(overrides = {}) {
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 1);
  return {
    title: "Community garden",
    description: "Help neighbors build and care for a shared garden together.",
    category: "Plantation",
    location: "Gulshan, Dhaka",
    date: future.toISOString().slice(0, 10),
    time: "09:00",
    image: "https://example.com/garden.jpg",
    ...overrides,
  };
}

test("eventInput trims event fields and accepts a valid future event", () => {
  const result = eventInput(validEvent({ title: "  Community garden  " }));
  assert.equal(result.title, "Community garden");
  assert.equal(result.image, "https://example.com/garden.jpg");
});

test("eventInput rejects invalid categories", () => {
  assert.throws(
    () => eventInput(validEvent({ category: "Other" })),
    (error) => error instanceof ApiError && error.status === 400,
  );
});

test("eventInput rejects invalid dates", () => {
  assert.throws(
    () => eventInput(validEvent({ date: "2027-02-30" })),
    (error) => error instanceof ApiError && error.message === "Enter a valid event date.",
  );
});

test("eventInput accepts and preserves a valid event time", () => {
  const result = eventInput(validEvent({ time: "18:45" }));
  assert.equal(result.time, "18:45");
});

test("eventInput rejects invalid event times", () => {
  assert.throws(
    () => eventInput(validEvent({ time: "25:90" })),
    (error) => error instanceof ApiError && error.status === 400,
  );
});

test("eventInput rejects non-HTTP image URLs", () => {
  assert.throws(
    () => eventInput(validEvent({ image: "javascript:alert(1)" })),
    (error) => error instanceof ApiError && error.message === "Enter a valid HTTP or HTTPS image URL.",
  );
});
