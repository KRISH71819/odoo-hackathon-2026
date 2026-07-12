import { Request, Response } from 'express';
import * as authService from './auth.service';
import { loginSchema, signupSchema } from './auth.validators';

interface AuthRequest extends Request {
  user?: { userId: string; role: string; email: string };
}

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  try {
    const result = await authService.signup(parsed.data);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  try {
    const result = await authService.login(parsed.data.email, parsed.data.password);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json(user);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
}

export async function listUsers(_req: AuthRequest, res: Response) {
  try {
    res.json({ success: true, data: await authService.listUsers() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
