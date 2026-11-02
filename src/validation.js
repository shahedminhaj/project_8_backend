export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const eventCategories = new Set([
  "Cleanup",
  "Plantation",
  "Donation",
  "Food drive",
  "Education",
  "Community",
]);

export function eventInput(body) {
  const fields = ["title", "description", "category", "location", "date", "image"];
  const values = Object.fromEntries(
    fields.map((field) => [field, typeof body?.[field] === "string" ? body[field].trim() : ""]),
  );

  if (
    values.title.length < 4 ||
    values.title.length > 80 ||
    values.description.length < 20 ||
    values.description.length > 800 ||
    !eventCategories.has(values.category) ||
    values.location.length < 3 ||
    values.location.length > 100 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(values.date)
  ) {
    throw new ApiError(400, "Provide valid event details.");
  }

  const date = new Date(`${values.date}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== values.date) {
    throw new ApiError(400, "Enter a valid event date.");
  }
  if (values.date <= new Date().toISOString().slice(0, 10)) {
    throw new ApiError(400, "Event dates must be in the future.");
  }

  let image;
  try {
    image = new URL(values.image);
  } catch {
    throw new ApiError(400, "Enter a valid HTTP or HTTPS image URL.");
  }

  if (image.protocol !== "http:" && image.protocol !== "https:") {
    throw new ApiError(400, "Enter a valid HTTP or HTTPS image URL.");
  }

  return { ...values, image: image.href };
}
