import cors from "cors";
import express from "express";
import { ObjectId } from "mongodb";
import { auth } from "./auth.js";
import { database, mongoClient } from "./database.js";
import { seedEvents } from "./seed.js";
import { ApiError, eventInput } from "./validation.js";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

const app = express();
const port = Number(process.env.PORT || 5000);
const frontendUrl = process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port between 1 and 65535.");
}

if (!frontendUrl) {
  throw new Error("CLIENT_ORIGIN is required.");
}
const events = database.collection("events");
const authHandler = toNodeHandler(auth);

function serializeEvent(event) {
  return {
    id: event._id.toString(),
    title: event.title,
    description: event.description,
    category: event.category,
    location: event.location,
    date: event.date,
    image: event.image,
    creatorEmail: event.creatorEmail,
    creatorName: event.creatorName,
  };
}

async function currentSession(request) {
  return auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
}

function validId(id) {
  if (!ObjectId.isValid(id)) throw new ApiError(400, "Invalid event id.");
  return new ObjectId(id);
}

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use((request, response, next) => {
  if (request.path.startsWith("/api/auth/")) {
    authHandler(request, response).catch(next);
    return;
  }
  next();
});
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/events", async (_request, response) => {
  const list = await events.find().sort({ date: 1, createdAt: -1 }).toArray();
  response.json(list.map(serializeEvent));
});

app.get("/api/events/joined", async (request, response) => {
  const session = await currentSession(request);
  if (!session) throw new ApiError(401, "Please sign in to view joined events.");

  const joined = await events.find({ attendees: session.user.id }).project({ _id: 1 }).toArray();
  response.json(joined.map((event) => event._id.toString()));
});

app.get("/api/events/:id", async (request, response) => {
  const event = await events.findOne({ _id: validId(request.params.id) });
  if (!event) throw new ApiError(404, "Event not found.");
  response.json(serializeEvent(event));
});

app.post("/api/events", async (request, response) => {
  const session = await currentSession(request);
  if (!session) throw new ApiError(401, "Please sign in to create an event.");

  const now = new Date();
  const event = {
    ...eventInput(request.body),
    creatorId: session.user.id,
    creatorEmail: session.user.email,
    creatorName: session.user.name,
    attendees: [],
    createdAt: now,
    updatedAt: now,
  };
  const result = await events.insertOne(event);
  response.status(201).json(serializeEvent({ ...event, _id: result.insertedId }));
});

app.patch("/api/events/:id", async (request, response) => {
  const session = await currentSession(request);
  if (!session) throw new ApiError(401, "Please sign in to update an event.");

  const id = validId(request.params.id);
  const event = await events.findOne({ _id: id });
  if (!event) throw new ApiError(404, "Event not found.");
  if (event.creatorId !== session.user.id) throw new ApiError(403, "You can only update events you created.");

  const updated = {
    ...eventInput(request.body),
    updatedAt: new Date(),
  };
  await events.updateOne({ _id: id }, { $set: updated });
  response.json(serializeEvent({ ...event, ...updated }));
});

app.delete("/api/events/:id", async (request, response) => {
  const session = await currentSession(request);
  if (!session) throw new ApiError(401, "Please sign in to delete an event.");

  const id = validId(request.params.id);
  const event = await events.findOne({ _id: id });
  if (!event) throw new ApiError(404, "Event not found.");
  if (event.creatorId !== session.user.id) throw new ApiError(403, "You can only delete events you created.");

  await events.deleteOne({ _id: id });
  response.status(204).end();
});

app.post("/api/events/:id/join", async (request, response) => {
  const session = await currentSession(request);
  if (!session) throw new ApiError(401, "Please sign in to join an event.");

  const result = await events.updateOne(
    { _id: validId(request.params.id) },
    { $addToSet: { attendees: session.user.id }, $set: { updatedAt: new Date() } },
  );
  if (!result.matchedCount) throw new ApiError(404, "Event not found.");
  response.json({ joined: true });
});

app.delete("/api/events/:id/join", async (request, response) => {
  const session = await currentSession(request);
  if (!session) throw new ApiError(401, "Please sign in to leave an event.");

  const result = await events.updateOne(
    { _id: validId(request.params.id) },
    { $pull: { attendees: session.user.id }, $set: { updatedAt: new Date() } },
  );
  if (!result.matchedCount) throw new ApiError(404, "Event not found.");
  response.json({ joined: false });
});

app.use((error, _request, response, _next) => {
  if (response.headersSent) return;
  if (error instanceof ApiError) {
    response.status(error.status).json({ message: error.message });
    return;
  }
  console.error(error);
  response.status(500).json({ message: "An unexpected server error occurred." });
});

await mongoClient.connect();
await seedEvents(events);
app.listen(port, () => {
  console.log(`Commonplace API listening on ${process.env.BETTER_AUTH_URL}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await mongoClient.close();
    process.exit(0);
  });
}
