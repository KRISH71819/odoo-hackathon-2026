import prisma from '../../config/db';

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
}

export async function listNotifications(userId: string, filters: NotificationFilters = {}) {
  const where: Record<string, unknown> = { userId };
  if (filters.type && filters.type !== 'ALL') where.type = filters.type;
  if (filters.isRead !== undefined) where.isRead = filters.isRead;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, unreadCount };
}

export async function markAsRead(id: string, userId: string) {
  const notification = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notification) throw createHttpError('Notification not found', 404);

  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { updatedCount: result.count };
}

/** Shared notification utility for maintenance and audit workflows. */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

function createHttpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}
