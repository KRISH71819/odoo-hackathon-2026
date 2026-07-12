import { z } from 'zod';

const maintenanceType = z.enum(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY']);
const maintenancePriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const maintenanceStatus = z.enum([
  'PENDING',
  'APPROVED',
  'TECHNICIAN_ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
]);

export const maintenanceFiltersSchema = z.object({
  status: maintenanceStatus.optional(),
  priority: maintenancePriority.optional(),
  assetId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  type: maintenanceType.optional(),
});

export const createMaintenanceSchema = z.object({
  assetId: z.string().uuid('assetId must be a valid UUID'),
  type: maintenanceType.default('CORRECTIVE'),
  priority: maintenancePriority.default('MEDIUM'),
  description: z.string().trim().min(3, 'Description must be at least 3 characters').max(2000),
});

export const updateMaintenanceSchema = z
  .object({
    priority: maintenancePriority.optional(),
    type: maintenanceType.optional(),
    description: z.string().trim().min(3).max(2000).optional(),
    assignedToId: z.string().uuid('assignedToId must be a valid UUID').nullable().optional(),
    cost: z.coerce.number().min(0, 'Cost cannot be negative').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');

export const updateMaintenanceStatusSchema = z.object({
  status: maintenanceStatus,
  assignedToId: z.string().uuid('assignedToId must be a valid UUID').optional(),
  resolutionNote: z.string().trim().min(3, 'Resolution note must be at least 3 characters').max(2000).optional(),
});

export const assignTechnicianSchema = z.object({
  assignedToId: z.string().uuid('assignedToId must be a valid UUID'),
});

export type MaintenanceFilters = z.infer<typeof maintenanceFiltersSchema>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type UpdateMaintenanceStatusInput = z.infer<typeof updateMaintenanceStatusSchema>;
