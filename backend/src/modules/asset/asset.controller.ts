import { Request, Response } from 'express';
import * as svc from './asset.service';
import {
  createAssetSchema,
  updateAssetSchema,
  allocateAssetSchema,
  transferAssetSchema,
  returnAssetSchema,
} from './asset.validators';

interface AuthRequest extends Request {
  user?: { userId: string; role: string; email: string };
}

// ── GET / ────────────────────────────────────────────────────
export async function listAssets(req: AuthRequest, res: Response) {
  try {
    const { search, tag, name, categoryId, status, location, page, limit } = req.query;
    const result = await svc.listAssets({
      search: search as string,
      tag: tag as string,
      name: name as string,
      categoryId: categoryId as string,
      status: status as string,
      location: location as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── POST / ───────────────────────────────────────────────────
export async function createAsset(req: AuthRequest, res: Response) {
  try {
    const parsed = createAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }
    const asset = await svc.createAsset(parsed.data);
    res.status(201).json({ success: true, data: asset });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ── GET /:id ─────────────────────────────────────────────────
export async function getAssetById(req: AuthRequest, res: Response) {
  try {
    const asset = await svc.getAssetById(req.params.id as string);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });
    res.json({ success: true, data: asset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── PUT /:id ─────────────────────────────────────────────────
export async function updateAsset(req: AuthRequest, res: Response) {
  try {
    const parsed = updateAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }
    const asset = await svc.updateAsset(req.params.id as string, parsed.data);
    res.json({ success: true, data: asset });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ── DELETE /:id ──────────────────────────────────────────────
export async function deleteAsset(req: AuthRequest, res: Response) {
  try {
    await svc.deleteAsset(req.params.id as string);
    res.json({ success: true, data: { message: 'Asset retired successfully' } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ── POST /:id/allocate ──────────────────────────────────────
export async function allocateAsset(req: AuthRequest, res: Response) {
  try {
    const parsed = allocateAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }
    const { allocatedToId, departmentId, reason } = parsed.data;
    const allocation = await svc.allocateAsset(req.params.id as string, allocatedToId, departmentId, reason);
    res.status(201).json({ success: true, data: allocation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ── POST /:id/transfer ─────────────────────────────────────
export async function transferAsset(req: AuthRequest, res: Response) {
  try {
    const parsed = transferAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }
    const { newAllocatedToId, reason } = parsed.data;
    const allocation = await svc.transferAsset(req.params.id as string, newAllocatedToId, reason);
    res.status(201).json({ success: true, data: allocation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ── POST /:id/return ────────────────────────────────────────
export async function returnAsset(req: AuthRequest, res: Response) {
  try {
    const parsed = returnAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }
    const allocation = await svc.returnAsset(req.params.id as string, parsed.data.reason);
    res.json({ success: true, data: allocation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ── PUT /allocations/:id/approve ────────────────────────────
export async function approveAllocation(req: AuthRequest, res: Response) {
  try {
    const allocation = await svc.approveAllocation(req.params.id as string, req.user!.userId);
    res.json({ success: true, data: allocation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ── PUT /allocations/:id/reject ─────────────────────────────
export async function rejectAllocation(req: AuthRequest, res: Response) {
  try {
    const allocation = await svc.rejectAllocation(req.params.id as string, req.user!.userId);
    res.json({ success: true, data: allocation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ── GET /:id/allocation-history ─────────────────────────────
export async function getAllocationHistory(req: AuthRequest, res: Response) {
  try {
    const history = await svc.getAllocationHistory(req.params.id as string);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
