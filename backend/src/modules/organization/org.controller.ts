import { Request, Response } from 'express';
import * as orgService from './org.service';
import { createDepartmentSchema, updateDepartmentSchema, createCategorySchema, createFacilitySchema, updateFacilitySchema } from './org.validators';

// ── Departments ────────────────────────────────────────────
export async function listDepartments(_req: Request, res: Response) {
  try { res.json({ success: true, data: await orgService.listDepartments() }); }
  catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
}

export async function createDepartment(req: Request, res: Response) {
  const parsed = createDepartmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  try { res.status(201).json({ success: true, data: await orgService.createDepartment(parsed.data) }); }
  catch (e: any) { res.status(e.statusCode || 500).json({ success: false, error: e.message }); }
}

export async function updateDepartment(req: Request, res: Response) {
  const parsed = updateDepartmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  try { res.json({ success: true, data: await orgService.updateDepartment(req.params.id as string, parsed.data) }); }
  catch (e: any) { res.status(e.statusCode || 500).json({ success: false, error: e.message }); }
}

export async function deleteDepartment(req: Request, res: Response) {
  try { res.json({ success: true, data: await orgService.deleteDepartment(req.params.id as string) }); }
  catch (e: any) { res.status(e.statusCode || 500).json({ success: false, error: e.message }); }
}

// ── Categories ─────────────────────────────────────────────
export async function listCategories(_req: Request, res: Response) {
  try { res.json({ success: true, data: await orgService.listCategories() }); }
  catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
}

export async function createCategory(req: Request, res: Response) {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  try { res.status(201).json({ success: true, data: await orgService.createCategory(parsed.data) }); }
  catch (e: any) { res.status(e.statusCode || 500).json({ success: false, error: e.message }); }
}

export async function deleteCategory(req: Request, res: Response) {
  try { res.json({ success: true, data: await orgService.deleteCategory(req.params.id as string) }); }
  catch (e: any) { res.status(e.statusCode || 500).json({ success: false, error: e.message }); }
}

// ── Facilities ─────────────────────────────────────────────
export async function listFacilities(_req: Request, res: Response) {
  try { res.json({ success: true, data: await orgService.listFacilities() }); }
  catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
}

export async function createFacility(req: Request, res: Response) {
  const parsed = createFacilitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  try { res.status(201).json({ success: true, data: await orgService.createFacility(parsed.data) }); }
  catch (e: any) { res.status(e.statusCode || 500).json({ success: false, error: e.message }); }
}

export async function updateFacility(req: Request, res: Response) {
  const parsed = updateFacilitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  try { res.json({ success: true, data: await orgService.updateFacility(req.params.id as string, parsed.data) }); }
  catch (e: any) { res.status(e.statusCode || 500).json({ success: false, error: e.message }); }
}

export async function deleteFacility(req: Request, res: Response) {
  try { res.json({ success: true, data: await orgService.deleteFacility(req.params.id as string) }); }
  catch (e: any) { res.status(e.statusCode || 500).json({ success: false, error: e.message }); }
}
