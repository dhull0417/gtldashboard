import { MongoClient } from "mongodb";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATS_PATH = path.join(__dirname, "..", "public", "data", "stats.json");

const COLLECTIONS = {
  users: "users",
  groups: "groups",
  meetups: "meetups",
};

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

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI environment variable is required");

  const existing = await loadExisting();
  const startDate = existing.length > 0 ? existing[0].date : todayUTC();
  const endDate = todayUTC();

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const [usersByDay, groupsByDay, meetupsByDay] = await Promise.all([
    countsByDay(db, COLLECTIONS.users, startDate),
    countsByDay(db, COLLECTIONS.groups, startDate),
    countsByDay(db, COLLECTIONS.meetups, startDate),
  ]);

  await client.close();

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
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
