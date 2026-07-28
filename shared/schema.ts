import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------- Functions (funções / instrumentos) ----------
export const functions = sqliteTable("functions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color").notNull().default("primary"), // primary | blue | gold | purple | success | orange
});

export const insertFunctionSchema = createInsertSchema(functions).omit({ id: true });
export type InsertFunction = z.infer<typeof insertFunctionSchema>;
export type FunctionRow = typeof functions.$inferSelect;

// ---------- Musicians (músicos / participantes) ----------
export const musicians = sqliteTable("musicians", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  functionIds: text("function_ids").notNull().default("[]"), // JSON array of function ids
});

export const insertMusicianSchema = createInsertSchema(musicians)
  .omit({ id: true })
  .extend({
    functionIds: z.array(z.number()).default([]),
  });
export type InsertMusician = z.infer<typeof insertMusicianSchema>;
export type MusicianRow = typeof musicians.$inferSelect;

// ---------- Services (cultos / eventos) ----------
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  date: text("date").notNull(), // ISO date YYYY-MM-DD
  time: text("time").notNull(), // HH:mm
  notes: text("notes").notNull().default(""),
});

export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type ServiceRow = typeof services.$inferSelect;

// ---------- Assignments (escalações) ----------
export const STATUS_VALUES = ["pending", "confirmed", "declined"] as const;
export type AssignmentStatus = (typeof STATUS_VALUES)[number];

export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceId: integer("service_id").notNull(),
  functionId: integer("function_id").notNull(),
  musicianId: integer("musician_id").notNull(),
  status: text("status").notNull().default("pending"),
});

export const insertAssignmentSchema = createInsertSchema(assignments)
  .omit({ id: true, status: true })
  .extend({
    status: z.enum(STATUS_VALUES).optional(),
  });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type AssignmentRow = typeof assignments.$inferSelect;

// ---------- Composed types (for API responses) ----------
export type AssignmentWithDetails = AssignmentRow & {
  functionName: string;
  functionColor: string;
  musicianName: string;
  musicianPhone: string;
};

export type ServiceWithAssignments = ServiceRow & {
  assignments: AssignmentWithDetails[];
};

// Payload used by the "Nova Escala" wizard to create a service + assignments at once
export const createScheduleSchema = z.object({
  service: insertServiceSchema,
  assignments: z.array(
    z.object({
      functionId: z.number(),
      musicianId: z.number(),
    })
  ),
});
export type CreateSchedulePayload = z.infer<typeof createScheduleSchema>;
