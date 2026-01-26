/** @type {import('drizzle-kit').Config} */
module.exports = {
  schema: './db/schema.ts',   // path to your schema file
  out: './db/migrations',     // folder where migrations will be saved
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  }
};
