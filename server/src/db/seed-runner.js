const { db, initDb } = require("./connection");
const { sampleTemplates } = require("./seeds");

async function runSeed() {
  try {
    await initDb();
    console.log("Resetting / re-seeding templates...");
    await db("templates").del();
    await db("templates").insert(sampleTemplates);
    console.log("Seeding complete! Total templates:", sampleTemplates.length);
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

runSeed();
