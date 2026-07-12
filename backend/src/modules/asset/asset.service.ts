import prisma from '../../config/db';

// ── List Assets (paginated, filtered) ────────────────────────
export async function listAssets(filters: {
  search?: string;
  tag?: string;
  name?: string;
  categoryId?: string;
  status?: string;
  location?: string;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 10, search, tag, name, categoryId, status, location } = filters;
  const where: any = {};

  if (search) {
    where.OR = [
      { tag: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
    ];
  } else {
    if (tag) where.tag = { contains: tag, mode: 'insensitive' };
    if (name) where.name = { contains: name, mode: 'insensitive' };
  }
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (location) where.location = { contains: location, mode: 'insensitive' };

  const [data, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { category: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.asset.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── Get Asset by ID ──────────────────────────────────────────
export async function getAssetById(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      allocations: {
        orderBy: { allocatedAt: 'desc' },
        include: {
          allocatedTo: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!asset) return null;

  const currentAllocation =
    asset.allocations.find(
      (a) => !a.returnedAt && a.status === 'APPROVED' && a.allocationType !== 'RETURN'
    ) || null;

  return { ...asset, currentAllocation };
}

// ── Create Asset ─────────────────────────────────────────────
export async function createAsset(data: {
  name: string;
  categoryId: string;
  location?: string | null;
  purchaseDate?: Date | null;
  purchaseCost?: number | null;
  warrantyExpiry?: Date | null;
  serialNumber?: string | null;
}) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new Error('Category not found');

  // ponytail: race on concurrent inserts, use DB sequence if volume matters
  const count = await prisma.asset.count();
  const tag = `AF-${String(count + 1).padStart(4, '0')}`;
  const qrCode = `ASSETFLOW-${tag}`;

  return prisma.asset.create({
    data: {
      tag,
      qrCode,
      name: data.name,
      categoryId: data.categoryId,
      status: 'AVAILABLE',
      condition: 'NEW',
      location: data.location ?? undefined,
      purchaseDate: data.purchaseDate ?? undefined,
      purchaseCost: data.purchaseCost ?? undefined,
      warrantyExpiry: data.warrantyExpiry ?? undefined,
      serialNumber: data.serialNumber ?? undefined,
    },
    include: { category: true },
  });
}

// ── Update Asset ─────────────────────────────────────────────
export async function updateAsset(
  id: string,
  data: {
    name?: string;
    categoryId?: string;
    condition?: string;
    location?: string | null;
    warrantyExpiry?: Date | null;
    serialNumber?: string | null;
  }
) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw new Error('Asset not found');

  return prisma.asset.update({
    where: { id },
    data: data as any,
    include: { category: true },
  });
}

// ── Delete (Soft → RETIRED) ─────────────────────────────────
export async function deleteAsset(id: string) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw new Error('Asset not found');
  if (asset.status === 'ALLOCATED')
    throw new Error('Cannot retire an allocated asset. Return it first.');

  return prisma.asset.update({
    where: { id },
    data: { status: 'RETIRED' },
  });
}

// ── Allocate Asset ───────────────────────────────────────────
export async function allocateAsset(
  assetId: string,
  allocatedToId: string,
  departmentId?: string | null,
  reason?: string | null
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Asset not found');

  // DOUBLE-ALLOCATION BLOCK — bulletproof
  if (asset.status === 'ALLOCATED') {
    throw new Error('Asset is already allocated. Transfer must be requested instead.');
  }
  if (asset.status !== 'AVAILABLE' && asset.status !== 'RESERVED') {
    throw new Error(`Asset cannot be allocated in ${asset.status} status.`);
  }

  return prisma.$transaction(async (tx) => {
    const allocation = await tx.assetAllocation.create({
      data: {
        assetId,
        allocatedToId,
        departmentId: departmentId || undefined,
        allocationType: 'ALLOCATE',
        status: 'PENDING',
        reason: reason || undefined,
      },
      include: {
        allocatedTo: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Reserve immediately (before approval)
    await tx.asset.update({
      where: { id: assetId },
      data: { status: 'RESERVED' },
    });

    return allocation;
  });
}

// ── Transfer Asset ───────────────────────────────────────────
export async function transferAsset(
  assetId: string,
  newAllocatedToId: string,
  reason?: string | null
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Asset not found');
  if (asset.status !== 'ALLOCATED') {
    throw new Error('Asset must be currently allocated to request a transfer.');
  }

  return prisma.assetAllocation.create({
    data: {
      assetId,
      allocatedToId: newAllocatedToId,
      allocationType: 'TRANSFER',
      status: 'PENDING',
      reason: reason || undefined,
    },
    include: {
      allocatedTo: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true } },
    },
  });
}

// ── Return Asset ─────────────────────────────────────────────
export async function returnAsset(assetId: string, reason?: string | null) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Asset not found');
  if (asset.status !== 'ALLOCATED') {
    throw new Error('Asset must be currently allocated to return.');
  }

  return prisma.$transaction(async (tx) => {
    // Close current active allocation
    const currentAllocation = await tx.assetAllocation.findFirst({
      where: { assetId, returnedAt: null, status: 'APPROVED', allocationType: { not: 'RETURN' } },
    });

    if (currentAllocation) {
      await tx.assetAllocation.update({
        where: { id: currentAllocation.id },
        data: { returnedAt: new Date() },
      });
    }

    const returnRecord = await tx.assetAllocation.create({
      data: {
        assetId,
        allocatedToId: currentAllocation?.allocatedToId ?? '',
        allocationType: 'RETURN',
        status: 'APPROVED',
        reason: reason || undefined,
        returnedAt: new Date(),
      },
      include: {
        allocatedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.asset.update({
      where: { id: assetId },
      data: { status: 'AVAILABLE' },
    });

    return returnRecord;
  });
}

// ── Approve Allocation ───────────────────────────────────────
export async function approveAllocation(allocationId: string, approvedById: string) {
  const allocation = await prisma.assetAllocation.findUnique({
    where: { id: allocationId },
  });
  if (!allocation) throw new Error('Allocation not found');
  if (allocation.status !== 'PENDING') throw new Error('Allocation is not pending approval.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.assetAllocation.update({
      where: { id: allocationId },
      data: { status: 'APPROVED', approvedById },
      include: {
        allocatedTo: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
    });

    if (allocation.allocationType === 'ALLOCATE') {
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: 'ALLOCATED' },
      });
    } else if (allocation.allocationType === 'TRANSFER') {
      // Close the old allocation
      const oldAllocation = await tx.assetAllocation.findFirst({
        where: {
          assetId: allocation.assetId,
          returnedAt: null,
          status: 'APPROVED',
          allocationType: { not: 'RETURN' },
          id: { not: allocationId },
        },
      });
      if (oldAllocation) {
        await tx.assetAllocation.update({
          where: { id: oldAllocation.id },
          data: { returnedAt: new Date() },
        });
      }
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: 'ALLOCATED' },
      });
    }

    return updated;
  });
}

// ── Reject Allocation ────────────────────────────────────────
export async function rejectAllocation(allocationId: string, approvedById: string) {
  const allocation = await prisma.assetAllocation.findUnique({
    where: { id: allocationId },
  });
  if (!allocation) throw new Error('Allocation not found');
  if (allocation.status !== 'PENDING') throw new Error('Allocation is not pending.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.assetAllocation.update({
      where: { id: allocationId },
      data: { status: 'REJECTED', approvedById },
    });

    // If it was an ALLOCATE that reserved the asset, release it
    if (allocation.allocationType === 'ALLOCATE') {
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: 'AVAILABLE' },
      });
    }

    return updated;
  });
}

// ── Allocation History ───────────────────────────────────────
export async function getAllocationHistory(assetId: string) {
  return prisma.assetAllocation.findMany({
    where: { assetId },
    orderBy: { allocatedAt: 'desc' },
    include: {
      allocatedTo: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });
}
