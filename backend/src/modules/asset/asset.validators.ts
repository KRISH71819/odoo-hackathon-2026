import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().uuid('Invalid category ID'),
  location: z.string().optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  purchaseCost: z.number().min(0, 'Cost must be >= 0').optional().nullable(),
  warrantyExpiry: z.coerce.date().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const allocateAssetSchema = z.object({
  allocatedToId: z.string().uuid('Invalid user ID'),
  departmentId: z.string().uuid('Invalid department ID').optional().nullable(),
  reason: z.string().optional().nullable(),
});

export const transferAssetSchema = z.object({
  newAllocatedToId: z.string().uuid('Invalid user ID'),
  reason: z.string().optional().nullable(),
});

export const returnAssetSchema = z.object({
  reason: z.string().optional().nullable(),
});
