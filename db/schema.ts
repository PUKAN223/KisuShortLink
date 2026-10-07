import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const links = sqliteTable("links", {
  slug: text("slug").primaryKey(),
  url: text("url").notNull(),
  createdAt: integer("created_at").notNull(),
  clicks: integer("clicks").notNull().default(0),
});
