import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { storage } from "./storage";
import {
  insertFunctionSchema,
  insertMusicianSchema,
  insertServiceSchema,
  createScheduleSchema,
  STATUS_VALUES,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ---------- Functions ----------
  app.get("/api/functions", (_req, res) => {
    res.json(storage.listFunctions());
  });

  app.post("/api/functions", (req, res) => {
    const parsed = insertFunctionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos" });
    res.status(201).json(storage.createFunction(parsed.data));
  });

  app.delete("/api/functions/:id", (req, res) => {
    storage.deleteFunction(Number(req.params.id));
    res.status(204).end();
  });

  // ---------- Musicians ----------
  app.get("/api/musicians", (_req, res) => {
    res.json(storage.listMusicians());
  });

  app.post("/api/musicians", (req, res) => {
    const parsed = insertMusicianSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos" });
    res.status(201).json(storage.createMusician(parsed.data));
  });

  app.patch("/api/musicians/:id", (req, res) => {
    const parsed = insertMusicianSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos" });
    const updated = storage.updateMusician(Number(req.params.id), parsed.data);
    if (!updated) return res.status(404).json({ message: "Músico não encontrado" });
    res.json(updated);
  });

  app.delete("/api/musicians/:id", (req, res) => {
    storage.deleteMusician(Number(req.params.id));
    res.status(204).end();
  });

  // ---------- Services (cultos / escalas) ----------
  app.get("/api/services", (_req, res) => {
    res.json(storage.listServices());
  });

  app.get("/api/services/:id", (req, res) => {
    const service = storage.getService(Number(req.params.id));
    if (!service) return res.status(404).json({ message: "Escala não encontrada" });
    res.json(service);
  });

  // Create a full schedule (service + assignments) in one shot — the wizard flow
  app.post("/api/services", (req, res) => {
    const parsed = createScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.issues });
    }
    const service = storage.createService(parsed.data.service);
    for (const a of parsed.data.assignments) {
      storage.createAssignment({ serviceId: service.id, functionId: a.functionId, musicianId: a.musicianId });
    }
    res.status(201).json(storage.getService(service.id));
  });

  app.patch("/api/services/:id", (req, res) => {
    const parsed = insertServiceSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos" });
    const updated = storage.updateService(Number(req.params.id), parsed.data);
    if (!updated) return res.status(404).json({ message: "Escala não encontrada" });
    res.json(storage.getService(updated.id));
  });

  app.delete("/api/services/:id", (req, res) => {
    storage.deleteService(Number(req.params.id));
    res.status(204).end();
  });

  // ---------- Assignments ----------
  app.post("/api/services/:id/assignments", (req, res) => {
    const schema = z.object({ functionId: z.number(), musicianId: z.number() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos" });
    storage.createAssignment({ serviceId: Number(req.params.id), ...parsed.data });
    res.status(201).json(storage.getService(Number(req.params.id)));
  });

  app.patch("/api/assignments/:id", (req, res) => {
    const schema = z.object({ status: z.enum(STATUS_VALUES) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos" });
    const updated = storage.updateAssignmentStatus(Number(req.params.id), parsed.data.status);
    if (!updated) return res.status(404).json({ message: "Escalação não encontrada" });
    res.json(storage.getService(updated.serviceId));
  });

  app.delete("/api/assignments/:id", (req, res) => {
    storage.deleteAssignment(Number(req.params.id));
    res.status(204).end();
  });

  return httpServer;
}
