import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.com' },
    update: {},
    create: {
      email: 'admin@assetflow.com',
      passwordHash: adminHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('  Admin user:', admin.email);

  // Manager user
  const managerHash = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@assetflow.com' },
    update: {},
    create: {
      email: 'manager@assetflow.com',
      passwordHash: managerHash,
      name: 'Priya Shah',
      role: 'MANAGER',
    },
  });

  // Employee user
  const empHash = await bcrypt.hash('employee123', 10);
  await prisma.user.upsert({
    where: { email: 'employee@assetflow.com' },
    update: {},
    create: {
      email: 'employee@assetflow.com',
      passwordHash: empHash,
      name: 'Ravi Kumar',
      role: 'EMPLOYEE',
    },
  });

  // Departments
  const engineering = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering', headName: 'Priya Shah' },
  });
  const hr = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: { name: 'Human Resources', headName: 'Anita Mehta' },
  });
  await prisma.department.upsert({
    where: { name: 'Finance' },
    update: {},
    create: { name: 'Finance', headName: 'Suresh Patel' },
  });

  // Categories
  const laptopCat = await prisma.category.upsert({
    where: { name: 'Laptops' },
    update: {},
    create: { name: 'Laptops' },
  });
  const projectorCat = await prisma.category.upsert({
    where: { name: 'Projectors' },
    update: {},
    create: { name: 'Projectors' },
  });
  await prisma.category.upsert({
    where: { name: 'Furniture' },
    update: {},
    create: { name: 'Furniture' },
  });
  await prisma.category.upsert({
    where: { name: 'Vehicles' },
    update: {},
    create: { name: 'Vehicles' },
  });

  // Facilities
  await prisma.facility.upsert({
    where: { name: 'Conference Room B3' },
    update: {},
    create: { name: 'Conference Room B3', type: 'Room', capacity: 20, location: '1st Floor' },
  });
  await prisma.facility.upsert({
    where: { name: 'Main Auditorium' },
    update: {},
    create: { name: 'Main Auditorium', type: 'Room', capacity: 200, location: 'Ground Floor' },
  });
  await prisma.facility.upsert({
    where: { name: 'Lab 101' },
    update: {},
    create: { name: 'Lab 101', type: 'Lab', capacity: 30, location: '2nd Floor' },
  });

  // Sample Assets
  const assets = [
    { tag: 'AF-0001', name: 'MacBook Pro 16"', categoryId: laptopCat.id, status: 'AVAILABLE' as const, condition: 'NEW' as const, location: '1st Floor', qrCode: 'ASSETFLOW-AF-0001' },
    { tag: 'AF-0002', name: 'Dell XPS 15', categoryId: laptopCat.id, status: 'ALLOCATED' as const, condition: 'GOOD' as const, location: '2nd Floor', qrCode: 'ASSETFLOW-AF-0002' },
    { tag: 'AF-0003', name: 'ThinkPad X1 Carbon', categoryId: laptopCat.id, status: 'AVAILABLE' as const, condition: 'GOOD' as const, location: '1st Floor', qrCode: 'ASSETFLOW-AF-0003' },
    { tag: 'AF-0004', name: 'Epson Projector EB-X51', categoryId: projectorCat.id, status: 'AVAILABLE' as const, condition: 'NEW' as const, location: 'Store Room', qrCode: 'ASSETFLOW-AF-0004' },
    { tag: 'AF-0005', name: 'BenQ MH535FHD', categoryId: projectorCat.id, status: 'UNDER_MAINTENANCE' as const, condition: 'NEEDS_REPAIR' as const, location: 'Store Room', qrCode: 'ASSETFLOW-AF-0005' },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { tag: asset.tag },
      update: {},
      create: asset,
    });
  }

  // Sample allocation
  const dell = await prisma.asset.findUnique({ where: { tag: 'AF-0002' } });
  if (dell) {
    const existingAlloc = await prisma.assetAllocation.findFirst({ where: { assetId: dell.id, returnedAt: null } });
    if (!existingAlloc) {
      await prisma.assetAllocation.create({
        data: {
          assetId: dell.id,
          allocatedToId: manager.id,
          departmentId: engineering.id,
          allocationType: 'ALLOCATE',
          status: 'APPROVED',
          reason: 'For project development',
        },
      });
    }
  }

  console.log('Seed completed!');
  console.log('  Login credentials:');
  console.log('    Admin:    admin@assetflow.com / admin123');
  console.log('    Manager:  manager@assetflow.com / manager123');
  console.log('    Employee: employee@assetflow.com / employee123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
