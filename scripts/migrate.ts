/**
 * Migration: add users and watch_history tables for authentication and watch tracking.
 *
 * Usage: DATABASE_URL=... bun run scripts/migrate.ts
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

async function main() {
  console.log("Running migration...");

  // --- Add video_type column (idempotent from prior migrations) ---
  await sql`
    ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'story';
  `;
  console.log("  Added video_type column (idempotent)");

  // --- Add book_order column ---
  await sql`
    ALTER TABLE videos ADD COLUMN IF NOT EXISTS book_order INTEGER;
  `;
  console.log("  Added book_order column (idempotent)");

  // --- Drop old unique constraint on youtube_id alone ---
  try {
    await sql`ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_youtube_id_key`;
    console.log("  Dropped videos_youtube_id_key constraint");
  } catch {
    console.log("  Constraint videos_youtube_id_key not found, continuing...");
  }

  await sql`DROP INDEX IF EXISTS videos_youtube_id_key`;
  await sql`DROP INDEX IF EXISTS videos_youtube_id_idx`;

  // --- Add new unique constraint on (youtube_id, title) ---
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'videos_youtube_id_title_key'
          AND conrelid = 'videos'::regclass
      ) THEN
        ALTER TABLE videos ADD CONSTRAINT videos_youtube_id_title_key UNIQUE (youtube_id, title);
      END IF;
    END $$;
  `;
  console.log("  Ensured videos_youtube_id_title_key constraint");

  // --- users table ---
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("  Created users table");

  // --- watch_history table ---
  await sql`
    CREATE TABLE IF NOT EXISTS watch_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      youtube_id TEXT NOT NULL,
      watched_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, youtube_id)
    );
  `;
  console.log("  Created watch_history table");

  // --- subscriptions table ---
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stripe_session_id TEXT,
      tier TEXT NOT NULL CHECK (tier IN ('pro', 'creator')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled', 'expired')),
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON subscriptions(user_id, status)`;
  console.log("  Created subscriptions table");

  console.log("Migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
