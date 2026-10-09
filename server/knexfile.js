require("dotenv").config();
const path = require("path");

const hasPostgres = Boolean(process.env.DATABASE_URL);

module.exports = {
  client: hasPostgres ? "pg" : "sqlite3",
  connection: hasPostgres
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        filename: path.resolve(__dirname, "database.sqlite"),
      },
  useNullAsDefault: !hasPostgres,
  pool: hasPostgres
    ? {
        min: 0,
        max: 10,
        acquireTimeoutMillis: 10000,
        createTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
      }
    : undefined,
};
