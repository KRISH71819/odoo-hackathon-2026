import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';

export async function getOverview(_req: Request, res: Response) {
  try {
    res.json({ success: true, data: await dashboardService.getOverview() });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getRecentActivity(req: Request, res: Response) {
  const rawLimit = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(Math.floor(rawLimit), 50)) : 10;
  try {
    res.json({ success: true, data: await dashboardService.getRecentActivity(limit) });
  } catch (error) {
    sendError(res, error);
  }
}

function sendError(res: Response, error: unknown) {
  const err = error as Error & { statusCode?: number };
  res.status(err.statusCode ?? 500).json({ success: false, error: err.message || 'Internal server error' });
}
