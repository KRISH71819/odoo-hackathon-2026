import prisma from '../../config/db';

export const reportTypes = [
  'utilization-by-department',
  'maintenance-frequency',
  'most-used-assets',
  'idle-assets',
  'assets-due-for-maintenance',
  'department-allocation-summary',
  'booking-heatmap',
] as const;

export type ReportType = (typeof reportTypes)[number];
export type ExportFormat = 'csv' | 'json';

export function isReportType(value: string): value is ReportType {
  return (reportTypes as readonly string[]).includes(value);
}

export async function getReportData(reportType: ReportType) {
  switch (reportType) {
    case 'utilization-by-department': return utilizationByDepartment();
    case 'maintenance-frequency': return maintenanceFrequency();
    case 'most-used-assets': return mostUsedAssets();
    case 'idle-assets': return idleAssets();
    case 'assets-due-for-maintenance': return assetsDueForMaintenance();
    case 'department-allocation-summary': return departmentAllocationSummary();
    case 'booking-heatmap': return bookingHeatmap();
  }
}

export async function utilizationByDepartment() {
  const [departments, totalAssets, allocations] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.asset.count({ where: { status: { not: 'RETIRED' } } }),
    prisma.assetAllocation.findMany({
      where: { departmentId: { not: null }, status: 'APPROVED', returnedAt: null },
      select: { departmentId: true, assetId: true },
    }),
  ]);

  const assetsByDepartment = new Map<string, Set<string>>();
  for (const allocation of allocations) {
    if (!allocation.departmentId) continue;
    const assets = assetsByDepartment.get(allocation.departmentId) ?? new Set<string>();
    assets.add(allocation.assetId);
    assetsByDepartment.set(allocation.departmentId, assets);
  }

  return departments.map((department) => {
    const allocatedCount = assetsByDepartment.get(department.id)?.size ?? 0;
    return {
      department: department.name,
      allocatedCount,
      percentage: totalAssets ? Number(((allocatedCount / totalAssets) * 100).toFixed(1)) : 0,
    };
  });
}

export async function maintenanceFrequency() {
  const grouped = await prisma.maintenanceRequest.groupBy({
    by: ['assetId'],
    _count: { _all: true },
    _max: { requestedAt: true },
  });
  const assets = await prisma.asset.findMany({
    where: { id: { in: grouped.map((row) => row.assetId) } },
    select: { id: true, tag: true, name: true, category: { select: { name: true } } },
  });
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  const rows: Array<{ assetTag: string; assetName: string; category: string; requestCount: number; lastRequestDate: Date | null }> = [];
  for (const row of grouped) {
    const asset = assetsById.get(row.assetId);
    if (asset) {
      rows.push({
        assetTag: asset.tag,
        assetName: asset.name,
        category: asset.category.name,
        requestCount: row._count._all,
        lastRequestDate: row._max.requestedAt,
      });
    }
  }
  return rows.sort((a, b) => b.requestCount - a.requestCount || String(b.lastRequestDate).localeCompare(String(a.lastRequestDate)));
}

export async function mostUsedAssets() {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const bookings = await prisma.booking.findMany({
    where: { assetId: { not: null }, startTime: { gte: since }, status: { not: 'CANCELLED' } },
    include: { asset: { select: { id: true, tag: true, name: true } } },
  });

  const usage = new Map<string, { assetTag: string; assetName: string; bookingCount: number; totalHours: number }>();
  for (const booking of bookings) {
    if (!booking.asset) continue;
    const current = usage.get(booking.asset.id) ?? {
      assetTag: booking.asset.tag,
      assetName: booking.asset.name,
      bookingCount: 0,
      totalHours: 0,
    };
    current.bookingCount += 1;
    current.totalHours += Math.max(0, (booking.endTime.getTime() - booking.startTime.getTime()) / 3_600_000);
    usage.set(booking.asset.id, current);
  }

  return [...usage.values()]
    .map((item) => ({ ...item, totalHours: Number(item.totalHours.toFixed(1)) }))
    .sort((a, b) => b.bookingCount - a.bookingCount || b.totalHours - a.totalHours);
}

export async function idleAssets() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const assets = await prisma.asset.findMany({
    where: {
      status: 'AVAILABLE',
      bookings: { none: { startTime: { gte: cutoff }, status: { not: 'CANCELLED' } } },
      allocations: { none: { allocatedAt: { gte: cutoff } } },
    },
    select: {
      tag: true,
      name: true,
      createdAt: true,
      category: { select: { name: true } },
      bookings: { where: { status: { not: 'CANCELLED' } }, orderBy: { endTime: 'desc' }, take: 1, select: { endTime: true } },
      allocations: { orderBy: { allocatedAt: 'desc' }, take: 1, select: { allocatedAt: true } },
    },
  });
  const now = Date.now();

  return assets
    .map((asset) => {
      const lastActivity = new Date(Math.max(
        asset.createdAt.getTime(),
        asset.bookings[0]?.endTime.getTime() ?? 0,
        asset.allocations[0]?.allocatedAt.getTime() ?? 0,
      ));
      return {
        assetTag: asset.tag,
        assetName: asset.name,
        category: asset.category.name,
        idleDays: Math.floor((now - lastActivity.getTime()) / 86_400_000),
      };
    })
    .sort((a, b) => b.idleDays - a.idleDays);
}

export async function assetsDueForMaintenance() {
  const now = new Date();
  const warrantyWindowEnd = new Date(now);
  warrantyWindowEnd.setDate(warrantyWindowEnd.getDate() + 30);
  const retirementCutoff = new Date(now);
  retirementCutoff.setFullYear(retirementCutoff.getFullYear() - 5);
  const assets = await prisma.asset.findMany({
    where: {
      OR: [
        { condition: { in: ['FAIR', 'NEEDS_REPAIR'] } },
        { warrantyExpiry: { gte: now, lte: warrantyWindowEnd } },
        { purchaseDate: { lte: retirementCutoff } },
      ],
    },
    select: { tag: true, name: true, condition: true, warrantyExpiry: true, purchaseDate: true },
  });

  return assets.map((asset) => {
    const reasons: string[] = [];
    const dueDates: Date[] = [];
    if (asset.condition === 'FAIR' || asset.condition === 'NEEDS_REPAIR') {
      reasons.push(`Condition is ${asset.condition.replace(/_/g, ' ').toLowerCase()}`);
      dueDates.push(now);
    }
    if (asset.warrantyExpiry && asset.warrantyExpiry >= now && asset.warrantyExpiry <= warrantyWindowEnd) {
      reasons.push('Warranty expires within 30 days');
      dueDates.push(asset.warrantyExpiry);
    }
    if (asset.purchaseDate && asset.purchaseDate <= retirementCutoff) {
      reasons.push('Approaching retirement age');
      const retirementDate = new Date(asset.purchaseDate);
      retirementDate.setFullYear(retirementDate.getFullYear() + 5);
      dueDates.push(retirementDate);
    }
    return {
      assetTag: asset.tag,
      assetName: asset.name,
      reason: reasons.join('; '),
      dueDate: new Date(Math.min(...dueDates.map((date) => date.getTime()))),
    };
  }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export async function departmentAllocationSummary() {
  const [departments, allocations] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.assetAllocation.findMany({
      where: { departmentId: { not: null }, status: 'APPROVED', returnedAt: null },
      select: { departmentId: true, assetId: true, asset: { select: { category: { select: { name: true } } } } },
    }),
  ]);
  const departmentAssets = new Map<string, Map<string, Set<string>>>();
  for (const allocation of allocations) {
    if (!allocation.departmentId) continue;
    const categories = departmentAssets.get(allocation.departmentId) ?? new Map<string, Set<string>>();
    const assets = categories.get(allocation.asset.category.name) ?? new Set<string>();
    assets.add(allocation.assetId);
    categories.set(allocation.asset.category.name, assets);
    departmentAssets.set(allocation.departmentId, categories);
  }

  return departments.map((department) => {
    const categories = departmentAssets.get(department.id) ?? new Map<string, Set<string>>();
    const items = [...categories.entries()]
      .map(([name, assets]) => ({ name, count: assets.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { department: department.name, categories: items, totalAssets: items.reduce((total, item) => total + item.count, 0) };
  });
}

export async function bookingHeatmap() {
  const matrix = Array.from({ length: 7 }, (_, dayOfWeek) =>
    Array.from({ length: 12 }, (_, hourOffset) => ({ dayOfWeek, hour: hourOffset + 8, count: 0 }))
  ).flat();
  const cells = new Map(matrix.map((cell) => [`${cell.dayOfWeek}-${cell.hour}`, cell]));
  const bookings = await prisma.booking.findMany({
    where: { status: { not: 'CANCELLED' } },
    select: { startTime: true, endTime: true },
  });

  for (const booking of bookings) {
    const cursor = new Date(booking.startTime);
    cursor.setMinutes(0, 0, 0);
    while (cursor < booking.endTime) {
      const hour = cursor.getHours();
      // JavaScript Sunday=0; the report contract is Monday=0 through Sunday=6.
      const dayOfWeek = (cursor.getDay() + 6) % 7;
      const cell = cells.get(`${dayOfWeek}-${hour}`);
      if (cell) cell.count += 1;
      cursor.setHours(cursor.getHours() + 1);
    }
  }
  return matrix;
}

export async function exportReport(reportType: ReportType, format: ExportFormat) {
  const data = await getReportData(reportType);
  const extension = format === 'csv' ? 'csv' : 'json';
  const content = format === 'csv' ? toCsv(data) : JSON.stringify(data, null, 2);
  return {
    content,
    filename: `${reportType}.${extension}`,
    contentType: format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8',
  };
}

function toCsv(data: unknown) {
  const rows = Array.isArray(data) ? data : [data];
  if (!rows.length) return '';
  const records = rows.map((row) => (row && typeof row === 'object' ? row as Record<string, unknown> : { value: row }));
  const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
  const escape = (value: unknown) => {
    const plain = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `"${plain.replace(/"/g, '""')}"`;
  };
  return [headers.join(','), ...records.map((record) => headers.map((header) => escape(record[header])).join(','))].join('\n');
}
