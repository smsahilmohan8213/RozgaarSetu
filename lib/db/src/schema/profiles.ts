import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  full_name: text("full_name"),
  phone: text("phone"),
  role: text("role"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ created_at: true });
export type InsertProfile = typeof profiles.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
