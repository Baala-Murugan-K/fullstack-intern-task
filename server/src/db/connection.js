const knex = require("knex");
const knexConfig = require("../../knexfile");
const { sampleTemplates } = require("./seeds");

const db = knex(knexConfig);

async function initDb() {
  try {
    const hasUsersTable = await db.schema.hasTable("users");
    if (!hasUsersTable) {
      await db.schema.createTable("users", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("email").unique().notNullable();
        table.string("password").notNullable();
        table.timestamp("created_at").defaultTo(db.fn.now());
      });
      console.log("Created users table");
    }

    const hasTemplatesTable = await db.schema.hasTable("templates");
    if (!hasTemplatesTable) {
      await db.schema.createTable("templates", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.text("description").notNullable();
        table.string("thumbnail_url").notNullable();
        table.string("category").notNullable();
        table.timestamp("created_at").defaultTo(db.fn.now());
      });
      console.log("Created templates table");
    }

    const hasFavoritesTable = await db.schema.hasTable("favorites");
    if (!hasFavoritesTable) {
      await db.schema.createTable("favorites", (table) => {
        table.increments("id").primary();
        table.integer("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.integer("template_id").unsigned().notNullable().references("id").inTable("templates").onDelete("CASCADE");
        table.timestamp("created_at").defaultTo(db.fn.now());
        table.unique(["user_id", "template_id"]);
      });
      console.log("Created favorites table");
    }

    // Auto-seed if templates is empty
    const templateCount = await db("templates").count("id as count").first();
    const count = parseInt(templateCount.count || 0, 10);
    if (count === 0) {
      console.log("Seeding initial SaaS templates...");
      await db("templates").insert(sampleTemplates);
      console.log(`Seeded ${sampleTemplates.length} templates successfully`);
    }
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

module.exports = { db, initDb };
