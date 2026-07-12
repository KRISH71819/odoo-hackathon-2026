import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function signup(data: { email: string; password: string; name: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: 'EMPLOYEE',
    },
  });

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, departmentId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}
