import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todaysJobs = await prisma.serviceJob.findMany({
      where: {
        serviceDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const totalJobsToday = todaysJobs.length;
    const pendingJobs = todaysJobs.filter(j => j.status === 'PENDING').length;
    const inProgressJobs = todaysJobs.filter(j => j.status === 'IN_PROGRESS').length;
    const completedJobs = todaysJobs.filter(j => j.status === 'COMPLETED' || j.status === 'DELIVERED').length;
    const todaysRevenue = todaysJobs.reduce((sum, j) => sum + j.paidAmount, 0);

    const lowStockItems = await prisma.$queryRaw`
      SELECT id, name, category, quantity, reorderLevel FROM InventoryItem WHERE quantity <= reorderLevel
    ` as { id: number; name: string; category: string; quantity: number; reorderLevel: number }[];

    const totalCustomers = await prisma.customer.count();
    const totalVehicles = await prisma.vehicle.count();

    const recentJobs = await prisma.serviceJob.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      today: startOfDay.toISOString().split('T')[0],
      todaysJobs: totalJobsToday,
      pendingJobs,
      inProgressJobs,
      completedJobs,
      revenue: Math.round(todaysRevenue * 100) / 100,
      lowStockItems,
      recentJobs,
      totalCustomers,
      totalVehicles,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
