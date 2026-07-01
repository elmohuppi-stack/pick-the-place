// Minimal Prisma config for production (no TypeScript/dotenv needed)
// Used by entrypoint.sh for runtime migrations
module.exports = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "file:./data/prod.db",
  },
};
