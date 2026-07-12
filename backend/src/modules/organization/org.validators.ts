import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  headName: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  status: z.enum(['Active', 'Inactive']).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const createFacilitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  capacity: z.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const updateFacilitySchema = createFacilitySchema.partial();
