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
      SELECT * FROM InventoryItem WHERE quantity <= reorderLevel
    ` as unknown[];

    const totalCustomers = await prisma.customer.count();
    const totalVehicles = await prisma.vehicle.count();

    res.json({
      today: startOfDay.toISOString().split('T')[0],
      totalJobsToday,
      pendingJobs,
      inProgressJobs,
      completedJobs,
      todaysRevenue: Math.round(todaysRevenue * 100) / 100,
      lowStockItems: (lowStockItems as unknown[]).length,
      totalCustomers,
      totalVehicles,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
