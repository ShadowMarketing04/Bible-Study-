/**
 * Seed script: seeds all 39 Old Testament books from ot-videos.json.
 * Idempotent — safe to run multiple times (uses ON CONFLICT DO NOTHING).
 *
 * Usage: DATABASE_URL=... bun run scripts/seed.ts
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

const GRADIENTS = [
  "from-emerald-600 via-green-500 to-lime-400",
  "from-sky-600 via-cyan-500 to-teal-400",
  "from-indigo-700 via-purple-500 to-pink-400",
  "from-red-800 via-red-600 to-amber-500",
  "from-amber-700 via-orange-500 to-yellow-500",
  "from-rose-700 via-red-500 to-orange-400",
  "from-violet-700 via-purple-600 to-fuchsia-500",
  "from-teal-700 via-cyan-600 to-blue-500",
];

interface OTBook {
  book: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: string;
  type: string;
  found: boolean;
}

async function main() {
  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      channel TEXT NOT NULL,
      youtube_id TEXT NOT NULL,
      gradient TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      video_type TEXT DEFAULT 'story',
      book_order INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT videos_youtube_id_title_key UNIQUE (youtube_id, title)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  console.log("Tables ready. Loading OT books...");

  const jsonPath = join(import.meta.dirname, "..", "..", "ot-videos.json");
  const raw = readFileSync(jsonPath, "utf-8");
  const books: OTBook[] = JSON.parse(raw);

  console.log(`Loaded ${books.length} books. Truncating old data...`);

  // Remove old seed data (which used different titles and a different unique constraint)
  await sql`DELETE FROM videos`;

  console.log("Seeding videos...");

  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const gradient = GRADIENTS[i % GRADIENTS.length];

    await sql`
      INSERT INTO videos (title, channel, youtube_id, gradient, views, video_type, book_order)
      VALUES (${b.book}, ${b.channel}, ${b.youtubeId}, ${gradient}, 0, ${b.type}, ${i + 1})
      ON CONFLICT (youtube_id, title) DO NOTHING;
    `;
    console.log(`  Seeded #${i + 1}: ${b.book} (${b.type})`);
  }

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
