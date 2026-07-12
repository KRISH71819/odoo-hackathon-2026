import prisma from '../../config/db';

export async function getOverview() {
  const now = new Date();
  const warrantyWindowEnd = new Date(now);
  warrantyWindowEnd.setDate(warrantyWindowEnd.getDate() + 30);

  const [
    totalAssets,
    assetsAvailable,
    assetsAllocated,
    assetsReserved,
    activeBookings,
    pendingReturns,
    upcomingReturns,
    pendingMaintenance,
    activeMaintenance,
  ] = await Promise.all([
    prisma.asset.count({ where: { status: { not: 'RETIRED' } } }),
    prisma.asset.count({ where: { status: 'AVAILABLE' } }),
    prisma.asset.count({ where: { status: 'ALLOCATED' } }),
    prisma.asset.count({ where: { status: 'RESERVED' } }),
    prisma.booking.count({ where: { status: { in: ['UPCOMING', 'ONGOING'] } } }),
    prisma.assetAllocation.count({ where: { allocationType: 'RETURN', status: 'PENDING' } }),
    prisma.asset.count({ where: { warrantyExpiry: { gte: now, lte: warrantyWindowEnd } } }),
    prisma.maintenanceRequest.count({ where: { status: 'PENDING' } }),
    prisma.maintenanceRequest.count({ where: { status: { in: ['APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'] } } }),
  ]);

  return {
    totalAssets,
    assetsAvailable,
    assetsAllocated,
    assetsReserved,
    activeBookings,
    pendingReturns,
    upcomingReturns,
    // The current schema has no planned/scheduled return date. Returning 0 avoids inventing overdue data.
    assetsOverdueForReturn: 0,
    pendingMaintenance,
    activeMaintenance,
  };
}

export async function getRecentActivity(limit = 10) {
  const activities = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { id: true, name: true } } },
  });

  return activities.map((activity) => ({
    ...activity,
    displayText: formatActivity(activity),
  }));
}

function formatActivity(activity: {
  action: string;
  entityType: string;
  details: string | null;
  user: { name: string } | null;
}) {
  let details: Record<string, unknown> = {};
  try {
    details = activity.details ? JSON.parse(activity.details) : {};
  } catch {
    details = {};
  }

  const assetLabel = typeof details.assetTag === 'string'
    ? details.assetTag
    : typeof details.assetName === 'string'
      ? details.assetName
      : activity.entityType;
  const action = activity.action.replace(/^MAINTENANCE_/, 'maintenance ').replace(/_/g, ' ').toLowerCase();
  return `${assetLabel} — ${action}${activity.user ? ` by ${activity.user.name}` : ''}`;
}
