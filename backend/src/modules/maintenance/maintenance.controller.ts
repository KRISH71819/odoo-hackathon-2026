import { Request, Response } from 'express';
import * as maintenanceService from './maintenance.service';
import {
  assignTechnicianSchema,
  createMaintenanceSchema,
  maintenanceFiltersSchema,
  updateMaintenanceSchema,
  updateMaintenanceStatusSchema,
} from './maintenance.validators';

interface AuthRequest extends Request {
  user?: { userId: string; role: string; email: string };
}

export async function listMaintenanceRequests(req: AuthRequest, res: Response) {
  const parsed = maintenanceFiltersSchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error.errors[0]?.message);
  try {
    const requests = await maintenanceService.listMaintenanceRequests(parsed.data);
    res.json({ success: true, data: requests });
  } catch (error) {
    sendError(res, error);
  }
}

export async function listMaintenanceAssignees(_req: AuthRequest, res: Response) {
  try {
    const users = await maintenanceService.listMaintenanceAssignees();
    res.json({ success: true, data: users });
  } catch (error) {
    sendError(res, error);
  }
}

export async function createMaintenanceRequest(req: AuthRequest, res: Response) {
  const parsed = createMaintenanceSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.errors[0]?.message);
  try {
    const request = await maintenanceService.createMaintenanceRequest(parsed.data, req.user!.userId);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateMaintenanceRequest(req: AuthRequest, res: Response) {
  const parsed = updateMaintenanceSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.errors[0]?.message);
  try {
    const request = await maintenanceService.updateMaintenanceRequest(req.params.id as string, parsed.data);
    res.json({ success: true, data: request });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateMaintenanceStatus(req: AuthRequest, res: Response) {
  const parsed = updateMaintenanceStatusSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.errors[0]?.message);
  try {
    const request = await maintenanceService.updateStatus(req.params.id as string, parsed.data, req.user!.userId);
    res.json({ success: true, data: request });
  } catch (error) {
    sendError(res, error);
  }
}

export async function assignTechnician(req: AuthRequest, res: Response) {
  const parsed = assignTechnicianSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.errors[0]?.message);
  try {
    const request = await maintenanceService.assignTechnician(req.params.id as string, parsed.data.assignedToId, req.user!.userId);
    res.json({ success: true, data: request });
  } catch (error) {
    sendError(res, error);
  }
}

function sendValidationError(res: Response, error?: string) {
  return res.status(400).json({ success: false, error: error ?? 'Invalid request data' });
}

function sendError(res: Response, error: unknown) {
  const err = error as Error & { statusCode?: number };
  res.status(err.statusCode ?? 500).json({ success: false, error: err.message || 'Internal server error' });
}
