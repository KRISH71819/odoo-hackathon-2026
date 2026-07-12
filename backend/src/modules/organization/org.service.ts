import prisma from '../../config/db';

// ── Departments ────────────────────────────────────────────
export async function listDepartments() {
  return prisma.department.findMany({
    include: {
      _count: { select: { users: true } },
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createDepartment(data: { name: string; headName?: string | null; parentId?: string | null }) {
  return prisma.department.create({ data: { name: data.name, headName: data.headName, parentId: data.parentId } });
}

export async function updateDepartment(id: string, data: any) {
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) throw Object.assign(new Error('Department not found'), { statusCode: 404 });
  return prisma.department.update({ where: { id }, data });
}

export async function deleteDepartment(id: string) {
  const dept = await prisma.department.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!dept) throw Object.assign(new Error('Department not found'), { statusCode: 404 });
  if (dept._count.users > 0) throw Object.assign(new Error('Cannot delete department with active users'), { statusCode: 400 });
  return prisma.department.delete({ where: { id } });
}

// ── Categories ─────────────────────────────────────────────
export async function listCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(data: { name: string }) {
  return prisma.category.create({ data });
}

export async function deleteCategory(id: string) {
  const cat = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { assets: true } } } });
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  if (cat._count.assets > 0) throw Object.assign(new Error('Cannot delete category with existing assets'), { statusCode: 400 });
  return prisma.category.delete({ where: { id } });
}

// ── Facilities ─────────────────────────────────────────────
export async function listFacilities() {
  return prisma.facility.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createFacility(data: { name: string; type: string; capacity?: number | null; location?: string | null }) {
  return prisma.facility.create({ data: { name: data.name, type: data.type, capacity: data.capacity, location: data.location } });
}

export async function updateFacility(id: string, data: any) {
  const fac = await prisma.facility.findUnique({ where: { id } });
  if (!fac) throw Object.assign(new Error('Facility not found'), { statusCode: 404 });
  return prisma.facility.update({ where: { id }, data });
}

export async function deleteFacility(id: string) {
  const fac = await prisma.facility.findUnique({ where: { id } });
  if (!fac) throw Object.assign(new Error('Facility not found'), { statusCode: 404 });
  return prisma.facility.delete({ where: { id } });
}
