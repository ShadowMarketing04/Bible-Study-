import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Test view increment
console.log("Before increment:");
let videos = await sql`SELECT id, title, channel, views FROM videos ORDER BY id`;
for (const v of videos) {
  console.log(`  ${v.id}: ${v.title} (${v.channel}) — ${v.views} views`);
}

// Simulate a view on Creation (id 1)
await sql`UPDATE videos SET views = views + 1 WHERE youtube_id = 'Fhk-MSOIGl8'`;
await sql`UPDATE videos SET views = views + 1 WHERE youtube_id = 'r8sabC-CHVA'`;

console.log("\nAfter 2 views (Creation + David and Goliath):");
videos = await sql`SELECT id, title, channel, views FROM videos ORDER BY views DESC`;
for (const v of videos) {
  console.log(`  ${v.id}: ${v.title} (${v.channel}) — ${v.views} views`);
}

// Test waitlist insert
await sql`INSERT INTO waitlist (email) VALUES ('test@vidview.com') ON CONFLICT (email) DO NOTHING`;
const waitlist = await sql`SELECT * FROM waitlist`;
console.log(`\nWaitlist entries: ${waitlist.length}`);
for (const w of waitlist) {
  console.log(`  ${w.id}: ${w.email} (${w.created_at})`);
}
