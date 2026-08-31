import { MongoClient } from "mongodb";
import { createClerkClient } from "@clerk/backend";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATS_PATH = path.join(__dirname, "..", "public", "data", "stats.json");
const INSIGHTS_PATH = path.join(__dirname, "..", "public", "data", "insights.json");

const COLLECTIONS = {
  users: "users",
  groups: "groups",
  meetups: "meetups",
};

const FREQUENCY_BUCKETS = ["daily", "weekly", "biweekly", "monthly"];

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysUTC(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function loadExisting() {
  try {
    const raw = await readFile(STATS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function countsByDay(db, collectionName, startDate) {
  const cursor = db.collection(collectionName).aggregate([
    { $match: { createdAt: { $gte: new Date(`${startDate}T00:00:00.000Z`) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
        count: { $sum: 1 },
      },
    },
  ]);
  const map = new Map();
  for await (const row of cursor) map.set(row._id, row.count);
  return map;
}

// Sign-in method priority when a user has multiple linked identifiers:
// Google OAuth > Email > Apple OAuth > Phone. Every user lands in exactly one bucket.
//
// Clerk attaches an email address to Google/Apple OAuth sign-ins automatically
// (Apple's is a private-relay address), tagged with verification.strategy
// "from_oauth_google" / "from_oauth_apple". Those don't count as "has email" —
// only an email the user supplied independently of OAuth does, otherwise every
// Apple sign-in would be misclassified as email and the Apple bucket would be
// structurally empty.
const OAUTH_EMAIL_STRATEGIES = new Set(["from_oauth_google", "from_oauth_apple"]);

function classifySignInMethod(user) {
  const providers = new Set(user.externalAccounts.map((a) => a.provider));
  const hasIndependentEmail = user.emailAddresses.some(
    (e) => !OAUTH_EMAIL_STRATEGIES.has(e.verification?.strategy)
  );
  if (providers.has("oauth_google")) return "google";
  if (hasIndependentEmail) return "email";
  if (providers.has("oauth_apple")) return "apple";
  if (user.phoneNumbers.length > 0) return "phone";
  return "unknown";
}

async function signInMethodCounts(clerk) {
  const counts = { google: 0, email: 0, apple: 0, phone: 0, unknown: 0 };
  const limit = 500;
  let offset = 0;
  while (true) {
    const { data, totalCount } = await clerk.users.getUserList({ limit, offset });
    for (const user of data) counts[classifySignInMethod(user)] += 1;
    offset += data.length;
    if (data.length === 0 || offset >= totalCount) break;
  }
  return counts;
}

async function softIndicatorCounts(db) {
  const users = db.collection("users");
  const nonEmpty = { $exists: true, $nin: [null, ""] };
  const [totalUsers, zipCode, profilePicture] = await Promise.all([
    users.countDocuments({}),
    users.countDocuments({ zipCode: nonEmpty }),
    users.countDocuments({ profilePicture: nonEmpty }),
  ]);
  return { totalUsers, zipCode, profilePicture };
}

async function permissionCounts(db) {
  const users = db.collection("users");
  const nonEmpty = { $exists: true, $nin: [null, ""] };
  const [totalUsers, notifications] = await Promise.all([
    users.countDocuments({}),
    users.countDocuments({ expoPushToken: nonEmpty }),
  ]);
  return { totalUsers, notifications };
}

function normalizeFrequency(frequency) {
  return frequency === "ordinal" ? "monthly" : frequency;
}

async function userHabits(db) {
  const totalUsers = await db.collection("users").countDocuments({});
  const nonDMGroups = await db
    .collection("groups")
    .find({ isDM: { $ne: true } })
    .project({ members: 1, owner: 1, "schedule.routines.frequency": 1 })
    .toArray();

  const groupCount = nonDMGroups.length;
  const totalMembers = nonDMGroups.reduce((sum, g) => sum + (g.members?.length ?? 0), 0);

  const groupsPerOwner = new Map();
  const frequency = Object.fromEntries(FREQUENCY_BUCKETS.map((b) => [b, 0]));
  for (const g of nonDMGroups) {
    const ownerKey = String(g.owner);
    groupsPerOwner.set(ownerKey, (groupsPerOwner.get(ownerKey) ?? 0) + 1);
    for (const routine of g.schedule?.routines ?? []) {
      const bucket = normalizeFrequency(routine.frequency);
      if (bucket in frequency) frequency[bucket] += 1;
    }
  }
  const creatorCounts = [...groupsPerOwner.values()];

  return {
    groupCount,
    avgGroupSize: groupCount > 0 ? round2(totalMembers / groupCount) : 0,
    avgGroupsPerUser: totalUsers > 0 ? round2(groupCount / totalUsers) : 0,
    creatorCount: creatorCounts.length,
    avgGroupsPerCreator:
      creatorCounts.length > 0 ? round2(creatorCounts.reduce((a, b) => a + b, 0) / creatorCounts.length) : 0,
    frequency,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI environment variable is required");
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) throw new Error("CLERK_SECRET_KEY environment variable is required");

  const existing = await loadExisting();
  const startDate = existing.length > 0 ? existing[0].date : todayUTC();
  const endDate = todayUTC();

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db();

  const [usersByDay, groupsByDay, meetupsByDay] = await Promise.all([
    countsByDay(db, COLLECTIONS.users, startDate),
    countsByDay(db, COLLECTIONS.groups, startDate),
    countsByDay(db, COLLECTIONS.meetups, startDate),
  ]);

  const days = [];
  for (let d = startDate; d <= endDate; d = addDaysUTC(d, 1)) {
    days.push({
      date: d,
      users: usersByDay.get(d) ?? 0,
      groups: groupsByDay.get(d) ?? 0,
      meetups: meetupsByDay.get(d) ?? 0,
    });
  }
  await writeFile(STATS_PATH, `${JSON.stringify(days, null, 2)}\n`, "utf8");
  console.log(`Wrote ${days.length} day(s) of stats (${startDate} -> ${endDate}) to ${STATS_PATH}`);

  const clerk = createClerkClient({ secretKey: clerkSecretKey });
  const insights = {
    asOf: endDate,
    signInMethods: await signInMethodCounts(clerk),
    permissions: await permissionCounts(db),
    softIndicators: await softIndicatorCounts(db),
    userHabits: await userHabits(db),
  };
  await writeFile(INSIGHTS_PATH, `${JSON.stringify(insights, null, 2)}\n`, "utf8");
  console.log(`Wrote insights snapshot (as of ${endDate}) to ${INSIGHTS_PATH}`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
