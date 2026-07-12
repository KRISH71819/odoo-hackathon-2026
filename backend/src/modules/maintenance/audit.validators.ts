import { z } from 'zod';

const condition = z.enum(['NEW', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'DECOMMISSIONED']);

export const createAuditSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  departmentId: z.string().uuid('departmentId must be a valid UUID').nullable().optional(),
  scheduledDate: z.coerce.date({ invalid_type_error: 'scheduledDate must be a valid date' }),
  notes: z.string().trim().max(2000).optional(),
});

export const updateAuditItemSchema = z
  .object({
    actualLocation: z.string().trim().max(300).nullable().optional(),
    actualCondition: condition.nullable().optional(),
    isVerified: z.boolean().optional(),
    discrepancyNote: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');

export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type UpdateAuditItemInput = z.infer<typeof updateAuditItemSchema>;
