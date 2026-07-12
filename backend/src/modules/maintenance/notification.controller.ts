import { Request, Response } from 'express';
import * as notificationService from './notification.service';

interface AuthRequest extends Request {
  user?: { userId: string; role: string; email: string };
}

export async function listNotifications(req: AuthRequest, res: Response) {
  try {
    const isRead = req.query.isRead === undefined ? undefined : req.query.isRead === 'true';
    const result = await notificationService.listNotifications(req.user!.userId, {
      type: req.query.type as string | undefined,
      isRead,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, error);
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user!.userId);
    res.json({ success: true, data: notification });
  } catch (error) {
    sendError(res, error);
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    const result = await notificationService.markAllAsRead(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, error);
  }
}

function sendError(res: Response, error: unknown) {
  const err = error as Error & { statusCode?: number };
  res.status(err.statusCode ?? 500).json({ success: false, error: err.message || 'Internal server error' });
}
