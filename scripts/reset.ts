import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

// Reset test views
await sql`UPDATE videos SET views = 0`;
// Remove test waitlist
await sql`DELETE FROM waitlist WHERE email = 'test@vidview.com'`;

console.log("Reset complete. All views at 0, test waitlist entry removed.");
