import prisma from '../../config/db';
import type { CreateAuditInput, UpdateAuditItemInput } from './audit.validators';

function createHttpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function hasDiscrepancy(item: {
  expectedLocation: string | null;
  actualLocation: string | null;
  expectedCondition: string | null;
  actualCondition: string | null;
  discrepancyNote: string | null;
}) {
  const locationMismatch = item.actualLocation !== null && item.actualLocation !== item.expectedLocation;
  const conditionMismatch = item.actualCondition !== null && item.actualCondition !== item.expectedCondition;
  return locationMismatch || conditionMismatch || Boolean(item.discrepancyNote);
}

function autoDiscrepancyNote(item: {
  expectedLocation: string | null;
  actualLocation: string | null;
  expectedCondition: string | null;
  actualCondition: string | null;
}) {
  const notes: string[] = [];
  if (item.actualLocation !== null && item.actualLocation !== item.expectedLocation) {
    notes.push(`Location mismatch: expected ${item.expectedLocation ?? 'not recorded'}, found ${item.actualLocation}`);
  }
  if (item.actualCondition !== null && item.actualCondition !== item.expectedCondition) {
    notes.push(`Condition mismatch: expected ${item.expectedCondition ?? 'not recorded'}, found ${item.actualCondition}`);
  }
  return notes.join('. ');
}

export async function listAudits() {
  const audits = await prisma.audit.findMany({
    include: {
      conductedBy: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { scheduledDate: 'desc' },
  });

  const departmentIds = audits.flatMap((audit) => (audit.departmentId ? [audit.departmentId] : []));
  const departments = departmentIds.length
    ? await prisma.department.findMany({ where: { id: { in: departmentIds } }, select: { id: true, name: true } })
    : [];
  const departmentsById = new Map(departments.map((department) => [department.id, department]));

  return audits.map(({ _count, ...audit }) => ({
    ...audit,
    department: audit.departmentId ? departmentsById.get(audit.departmentId) ?? null : null,
    itemCount: _count.items,
  }));
}

export async function createAudit(data: CreateAuditInput, conductedById: string) {
  if (data.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: data.departmentId }, select: { id: true } });
    if (!department) throw createHttpError('Department not found', 404);
  }

  const assets = await prisma.asset.findMany({
    where: data.departmentId
      ? { allocations: { some: { departmentId: data.departmentId, status: 'APPROVED', returnedAt: null } } }
      : {},
    select: { id: true, location: true, condition: true },
  });

  return prisma.audit.create({
    data: {
      title: data.title,
      departmentId: data.departmentId ?? null,
      conductedById,
      scheduledDate: data.scheduledDate,
      notes: data.notes,
      status: 'SCHEDULED',
      items: {
        create: assets.map((asset) => ({
          assetId: asset.id,
          expectedLocation: asset.location,
          expectedCondition: asset.condition,
          isVerified: false,
        })),
      },
    },
    include: { _count: { select: { items: true } } },
  });
}

export async function getAuditById(id: string) {
  const audit = await prisma.audit.findUnique({
    where: { id },
    include: {
      conductedBy: { select: { id: true, name: true } },
      items: {
        include: {
          asset: {
            select: { id: true, tag: true, name: true, location: true, condition: true, category: { select: { name: true } } },
          },
        },
        orderBy: { asset: { tag: 'asc' } },
      },
    },
  });
  if (!audit) throw createHttpError('Audit not found', 404);

  const department = audit.departmentId
    ? await prisma.department.findUnique({ where: { id: audit.departmentId }, select: { id: true, name: true } })
    : null;
  const discrepancyCount = audit.items.filter(hasDiscrepancy).length;
  const verifiedCount = audit.items.filter((item) => item.isVerified).length;

  return {
    ...audit,
    department,
    summary: { totalItems: audit.items.length, verifiedCount, discrepancyCount },
  };
}

export async function updateAuditItem(auditId: string, itemId: string, data: UpdateAuditItemInput) {
  const item = await prisma.auditItem.findFirst({ where: { id: itemId, auditId } });
  if (!item) throw createHttpError('Audit item not found', 404);

  const actualLocation = data.actualLocation === undefined ? item.actualLocation : data.actualLocation;
  const actualCondition = data.actualCondition === undefined ? item.actualCondition : data.actualCondition;
  const mismatchNote = autoDiscrepancyNote({
    expectedLocation: item.expectedLocation,
    actualLocation,
    expectedCondition: item.expectedCondition,
    actualCondition,
  });

  return prisma.auditItem.update({
    where: { id: itemId },
    data: {
      actualLocation: data.actualLocation,
      actualCondition: data.actualCondition,
      isVerified: data.isVerified,
      discrepancyNote: data.discrepancyNote === undefined ? (mismatchNote || item.discrepancyNote) : data.discrepancyNote,
      checkedAt: new Date(),
    },
    include: { asset: { select: { id: true, tag: true, name: true, location: true, condition: true } } },
  });
}

export async function generateReport(auditId: string) {
  const audit = await getAuditById(auditId);
  const discrepancies = audit.items.filter(hasDiscrepancy);
  const totalAssetsAudited = audit.items.length;
  const verifiedCount = audit.items.filter((item) => item.isVerified).length;
  const verificationPercentage = totalAssetsAudited
    ? Number(((verifiedCount / totalAssetsAudited) * 100).toFixed(1))
    : 0;

  const report = {
    auditId: audit.id,
    title: audit.title,
    totalAssetsAudited,
    verifiedCount,
    verificationPercentage,
    discrepancyCount: discrepancies.length,
    discrepantAssets: discrepancies.map((item) => ({
      auditItemId: item.id,
      asset: { id: item.asset.id, tag: item.asset.tag, name: item.asset.name },
      expectedLocation: item.expectedLocation,
      actualLocation: item.actualLocation,
      expectedCondition: item.expectedCondition,
      actualCondition: item.actualCondition,
      discrepancyNote: item.discrepancyNote,
    })),
  };

  await prisma.$transaction([
    prisma.audit.update({ where: { id: auditId }, data: { status: 'COMPLETED', completedDate: new Date() } }),
    prisma.notification.create({
      data: {
        userId: audit.conductedById,
        type: 'AUDIT',
        title: 'Audit completed',
        message: `Audit ${audit.title} completed — ${discrepancies.length} discrepancies found.`,
        link: `/audits?audit=${auditId}`,
      },
    }),
  ]);

  return report;
}
