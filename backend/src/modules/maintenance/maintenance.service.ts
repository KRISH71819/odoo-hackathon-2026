import { Prisma } from '@prisma/client';
import prisma from '../../config/db';
import type {
  CreateMaintenanceInput,
  MaintenanceFilters,
  UpdateMaintenanceInput,
  UpdateMaintenanceStatusInput,
} from './maintenance.validators';

const maintenanceInclude = {
  asset: { select: { id: true, tag: true, name: true, status: true } },
  requestedBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.MaintenanceRequestInclude;

const validTransitions: Record<string, string> = {
  PENDING: 'APPROVED',
  APPROVED: 'TECHNICIAN_ASSIGNED',
  TECHNICIAN_ASSIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
};

export async function listMaintenanceRequests(filters: MaintenanceFilters = {}) {
  const where: Prisma.MaintenanceRequestWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assetId) where.assetId = filters.assetId;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.type) where.type = filters.type;

  return prisma.maintenanceRequest.findMany({
    where,
    include: maintenanceInclude,
    orderBy: [{ priority: 'desc' }, { requestedAt: 'desc' }],
  });
}

/** Users eligible to be assigned from the maintenance board. */
export async function listMaintenanceAssignees() {
  return prisma.user.findMany({
    select: { id: true, name: true, role: true },
    orderBy: [{ name: 'asc' }],
  });
}

export async function createMaintenanceRequest(data: CreateMaintenanceInput, requestedById: string) {
  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw createHttpError('Asset not found', 404);
  if (asset.status === 'RETIRED') throw createHttpError('Retired assets cannot be maintained', 400);
  if (asset.status === 'UNDER_MAINTENANCE') {
    throw createHttpError('This asset already has an active maintenance request', 409);
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.create({
      data: {
        assetId: data.assetId,
        requestedById,
        type: data.type,
        priority: data.priority,
        description: data.description,
        status: 'PENDING',
      },
      include: maintenanceInclude,
    });

    await tx.asset.update({
      where: { id: data.assetId },
      data: { status: 'UNDER_MAINTENANCE' },
    });

    const reviewers = await tx.user.findMany({
      where: { role: { in: ['ADMIN', 'MANAGER'] } },
      select: { id: true },
    });
    if (reviewers.length) {
      await tx.notification.createMany({
        data: reviewers.map((user) => ({
          userId: user.id,
          type: 'MAINTENANCE',
          title: 'New Maintenance Request',
          message: `Maintenance requested for ${asset.tag}: ${data.description}`,
          link: `/maintenance?request=${request.id}`,
        })),
      });
    }

    await tx.activityLog.create({
      data: {
        userId: requestedById,
        action: 'MAINTENANCE_REQUEST_CREATED',
        entityType: 'MaintenanceRequest',
        entityId: request.id,
        details: JSON.stringify({ assetId: asset.id, assetTag: asset.tag, priority: data.priority }),
      },
    });

    return request;
  });
}

export async function updateMaintenanceRequest(id: string, data: UpdateMaintenanceInput) {
  await ensureRequestExists(id);
  if (data.assignedToId) await ensureUserExists(data.assignedToId);

  return prisma.maintenanceRequest.update({
    where: { id },
    data: {
      priority: data.priority,
      type: data.type,
      description: data.description,
      assignedToId: data.assignedToId,
      cost: data.cost,
    },
    include: maintenanceInclude,
  });
}

export async function updateStatus(
  id: string,
  data: UpdateMaintenanceStatusInput,
  actorId: string
) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { asset: { select: { id: true, tag: true } }, requestedBy: { select: { id: true } } },
  });
  if (!request) throw createHttpError('Maintenance request not found', 404);

  const expectedStatus = validTransitions[request.status];
  if (expectedStatus !== data.status) {
    throw createHttpError(`Invalid status transition: ${request.status} can only move to ${expectedStatus ?? 'no further status'}`, 400);
  }
  if (data.status === 'TECHNICIAN_ASSIGNED' && !data.assignedToId) {
    throw createHttpError('assignedToId is required when assigning a technician', 400);
  }
  if (data.status === 'RESOLVED' && !data.resolutionNote) {
    throw createHttpError('resolutionNote is required when resolving a request', 400);
  }
  if (data.assignedToId) await ensureUserExists(data.assignedToId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: data.status,
        assignedToId: data.assignedToId,
        resolutionNote: data.status === 'RESOLVED' ? data.resolutionNote : undefined,
        resolvedAt: data.status === 'RESOLVED' ? new Date() : undefined,
      },
      include: maintenanceInclude,
    });

    if (data.status === 'TECHNICIAN_ASSIGNED' && data.assignedToId) {
      await tx.notification.create({
        data: {
          userId: data.assignedToId,
          type: 'MAINTENANCE',
          title: 'Maintenance request assigned to you',
          message: `You have been assigned maintenance for ${request.asset.tag}.`,
          link: `/maintenance?request=${id}`,
        },
      });
    }

    if (data.status === 'RESOLVED') {
      await tx.asset.update({ where: { id: request.assetId }, data: { status: 'AVAILABLE' } });
      await tx.notification.create({
        data: {
          userId: request.requestedBy.id,
          type: 'MAINTENANCE',
          title: 'Maintenance request resolved',
          message: `Maintenance for ${request.asset.tag} has been resolved.`,
          link: `/maintenance?request=${id}`,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        userId: actorId,
        action: `MAINTENANCE_${data.status}`,
        entityType: 'MaintenanceRequest',
        entityId: id,
        details: JSON.stringify({ assetId: request.assetId, status: data.status }),
      },
    });

    return updated;
  });
}

export async function assignTechnician(id: string, assignedToId: string, actorId: string) {
  return updateStatus(id, { status: 'TECHNICIAN_ASSIGNED', assignedToId }, actorId);
}

async function ensureRequestExists(id: string) {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id }, select: { id: true } });
  if (!request) throw createHttpError('Maintenance request not found', 404);
}

async function ensureUserExists(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) throw createHttpError('Assigned user not found', 404);
}

function createHttpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}
