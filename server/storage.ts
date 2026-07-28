import {
  functions,
  musicians,
  services,
  assignments,
  type FunctionRow,
  type InsertFunction,
  type MusicianRow,
  type InsertMusician,
  type ServiceRow,
  type InsertService,
  type AssignmentRow,
  type InsertAssignment,
  type AssignmentWithDetails,
  type ServiceWithAssignments,
  type AssignmentStatus,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";

// On Vercel's serverless runtime the project directory is read-only; only /tmp is writable.
// Data will reset on cold starts there — acceptable for a demo deployment.
const dbPath = process.env.VERCEL ? "/tmp/data.db" : "data.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// ---------- Migrations (lightweight, no drizzle-kit needed for this app) ----------
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS functions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'primary'
  );
  CREATE TABLE IF NOT EXISTS musicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    function_ids TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    function_id INTEGER NOT NULL,
    musician_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
  );
`);

// ---------- Seed default functions + a few musicians on first run ----------
function seedIfEmpty() {
  const count = (sqlite.prepare("SELECT COUNT(*) as c FROM functions").get() as { c: number }).c;
  if (count > 0) return;

  const defaultFunctions: Array<{ name: string; color: string }> = [
    { name: "Vocal", color: "primary" },
    { name: "Violão / Guitarra", color: "gold" },
    { name: "Baixo", color: "blue" },
    { name: "Bateria", color: "orange" },
    { name: "Teclado", color: "purple" },
    { name: "Som", color: "success" },
    { name: "Projeção", color: "blue" },
    { name: "Direção do Culto", color: "primary" },
  ];
  const insertFn = sqlite.prepare("INSERT INTO functions (name, color) VALUES (?, ?)");
  for (const f of defaultFunctions) insertFn.run(f.name, f.color);

  const defaultMusicians: Array<{ name: string; phone: string; functionIds: number[] }> = [
    { name: "Ana Souza", phone: "(61) 99123-4501", functionIds: [1, 8] },
    { name: "Bruno Lima", phone: "(61) 99123-4502", functionIds: [2] },
    { name: "Carla Mendes", phone: "(61) 99123-4503", functionIds: [1] },
    { name: "Diego Alves", phone: "(61) 99123-4504", functionIds: [3] },
    { name: "Elaine Costa", phone: "(61) 99123-4505", functionIds: [4] },
    { name: "Fábio Rocha", phone: "(61) 99123-4506", functionIds: [5] },
    { name: "Gabriela Nunes", phone: "(61) 99123-4507", functionIds: [6] },
    { name: "Hugo Martins", phone: "(61) 99123-4508", functionIds: [7] },
  ];
  const insertM = sqlite.prepare("INSERT INTO musicians (name, phone, function_ids) VALUES (?, ?, ?)");
  for (const m of defaultMusicians) insertM.run(m.name, m.phone, JSON.stringify(m.functionIds));
}
seedIfEmpty();

// ---------- Helpers ----------
function toMusician(row: MusicianRow): MusicianRow & { functionIds: number[] } {
  return { ...row, functionIds: JSON.parse(row.functionIds || "[]") } as any;
}

export interface IStorage {
  // Functions
  listFunctions(): FunctionRow[];
  createFunction(data: InsertFunction): FunctionRow;
  deleteFunction(id: number): void;

  // Musicians
  listMusicians(): (MusicianRow & { functionIds: number[] })[];
  getMusician(id: number): (MusicianRow & { functionIds: number[] }) | undefined;
  createMusician(data: InsertMusician): MusicianRow;
  updateMusician(id: number, data: Partial<InsertMusician>): MusicianRow | undefined;
  deleteMusician(id: number): void;

  // Services
  listServices(): ServiceWithAssignments[];
  getService(id: number): ServiceWithAssignments | undefined;
  createService(data: InsertService): ServiceRow;
  updateService(id: number, data: Partial<InsertService>): ServiceRow | undefined;
  deleteService(id: number): void;

  // Assignments
  createAssignment(data: InsertAssignment): AssignmentRow;
  updateAssignmentStatus(id: number, status: AssignmentStatus): AssignmentRow | undefined;
  deleteAssignment(id: number): void;
}

export class DatabaseStorage implements IStorage {
  // ---- Functions ----
  listFunctions(): FunctionRow[] {
    return db.select().from(functions).all();
  }
  createFunction(data: InsertFunction): FunctionRow {
    return db.insert(functions).values(data).returning().get();
  }
  deleteFunction(id: number): void {
    db.delete(functions).where(eq(functions.id, id)).run();
  }

  // ---- Musicians ----
  listMusicians() {
    return db.select().from(musicians).all().map(toMusician);
  }
  getMusician(id: number) {
    const row = db.select().from(musicians).where(eq(musicians.id, id)).get();
    return row ? toMusician(row) : undefined;
  }
  createMusician(data: InsertMusician): MusicianRow {
    return db
      .insert(musicians)
      .values({ ...data, functionIds: JSON.stringify(data.functionIds ?? []) } as any)
      .returning()
      .get();
  }
  updateMusician(id: number, data: Partial<InsertMusician>): MusicianRow | undefined {
    const payload: any = { ...data };
    if (data.functionIds) payload.functionIds = JSON.stringify(data.functionIds);
    return db.update(musicians).set(payload).where(eq(musicians.id, id)).returning().get();
  }
  deleteMusician(id: number): void {
    db.delete(musicians).where(eq(musicians.id, id)).run();
  }

  // ---- Services ----
  private hydrateService(service: ServiceRow): ServiceWithAssignments {
    const rows = db.select().from(assignments).where(eq(assignments.serviceId, service.id)).all();
    const allFunctions = this.listFunctions();
    const allMusicians = this.listMusicians();
    const details: AssignmentWithDetails[] = rows.map((a) => {
      const fn = allFunctions.find((f) => f.id === a.functionId);
      const mu = allMusicians.find((m) => m.id === a.musicianId);
      return {
        ...a,
        functionName: fn?.name ?? "Função removida",
        functionColor: fn?.color ?? "primary",
        musicianName: mu?.name ?? "Músico removido",
        musicianPhone: mu?.phone ?? "",
      };
    });
    return { ...service, assignments: details };
  }

  listServices(): ServiceWithAssignments[] {
    return db.select().from(services).all().map((s) => this.hydrateService(s));
  }
  getService(id: number): ServiceWithAssignments | undefined {
    const row = db.select().from(services).where(eq(services.id, id)).get();
    return row ? this.hydrateService(row) : undefined;
  }
  createService(data: InsertService): ServiceRow {
    return db.insert(services).values(data).returning().get();
  }
  updateService(id: number, data: Partial<InsertService>): ServiceRow | undefined {
    return db.update(services).set(data).where(eq(services.id, id)).returning().get();
  }
  deleteService(id: number): void {
    db.delete(assignments).where(eq(assignments.serviceId, id)).run();
    db.delete(services).where(eq(services.id, id)).run();
  }

  // ---- Assignments ----
  createAssignment(data: InsertAssignment): AssignmentRow {
    return db
      .insert(assignments)
      .values({ ...data, status: data.status ?? "pending" })
      .returning()
      .get();
  }
  updateAssignmentStatus(id: number, status: AssignmentStatus): AssignmentRow | undefined {
    return db.update(assignments).set({ status }).where(eq(assignments.id, id)).returning().get();
  }
  deleteAssignment(id: number): void {
    db.delete(assignments).where(eq(assignments.id, id)).run();
  }
}

export const storage = new DatabaseStorage();
