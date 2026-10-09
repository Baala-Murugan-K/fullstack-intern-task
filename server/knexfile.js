require("dotenv").config();
const path = require("path");
const { parse } = require("pg-connection-string");

const hasPostgres = Boolean(process.env.DATABASE_URL);

let connectionConfig;

if (hasPostgres) {
  try {
    // Safely parse URL and ensure ssl.rejectUnauthorized = false for Supabase
    const parsed = parse(process.env.DATABASE_URL);
    connectionConfig = {
      user: parsed.user,
      password: parsed.password,
      host: parsed.host,
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: parsed.database,
      ssl: { rejectUnauthorized: false },
    };
  } catch (e) {
    connectionConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  }
} else {
  connectionConfig = {
    filename: path.resolve(__dirname, "database.sqlite"),
  };
}

module.exports = {
  client: hasPostgres ? "pg" : "sqlite3",
  connection: connectionConfig,
  useNullAsDefault: !hasPostgres,
  pool: hasPostgres
    ? {
        min: 0,
        max: 10,
        acquireTimeoutMillis: 15000,
        createTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      }
    : undefined,
};
