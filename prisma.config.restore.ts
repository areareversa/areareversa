import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://neondb_owner:npg_Z4aT9nyDNtiV@ep-raspy-waterfall-b6t4h55t-pooler.c-2.sa-east-1.aws.neon.tech/areareversadb?sslmode=require&channel_binding=require",
  },
});