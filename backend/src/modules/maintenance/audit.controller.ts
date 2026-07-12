import { Request, Response } from 'express';
import * as auditService from './audit.service';
import { createAuditSchema, updateAuditItemSchema } from './audit.validators';

interface AuthRequest extends Request {
  user?: { userId: string; role: string; email: string };
}

export async function listAudits(_req: AuthRequest, res: Response) {
  try {
    res.json({ success: true, data: await auditService.listAudits() });
  } catch (error) {
    sendError(res, error);
  }
}

export async function createAudit(req: AuthRequest, res: Response) {
  const parsed = createAuditSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.errors[0]?.message);
  try {
    const audit = await auditService.createAudit(parsed.data, req.user!.userId);
    res.status(201).json({ success: true, data: audit });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getAuditById(req: AuthRequest, res: Response) {
  try {
    res.json({ success: true, data: await auditService.getAuditById(req.params.id) });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateAuditItem(req: AuthRequest, res: Response) {
  const parsed = updateAuditItemSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.errors[0]?.message);
  try {
    const item = await auditService.updateAuditItem(req.params.auditId, req.params.itemId, parsed.data);
    res.json({ success: true, data: item });
  } catch (error) {
    sendError(res, error);
  }
}

export async function generateReport(req: AuthRequest, res: Response) {
  try {
    res.json({ success: true, data: await auditService.generateReport(req.params.id) });
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
