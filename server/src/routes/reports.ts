import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period } = req.query; // daily, weekly, monthly

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default: // daily
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const jobs = await prisma.serviceJob.findMany({
      where: { serviceDate: { gte: startDate } },
    });

    const totalJobs = jobs.length;
    const totalRevenue = jobs.reduce((sum, job) => sum + job.totalAmount, 0);
    const totalPaid = jobs.reduce((sum, job) => sum + job.paidAmount, 0);
    const totalOutstanding = jobs.reduce((sum, job) => sum + job.balanceAmount, 0);
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'DELIVERED').length;

    res.json({
      period: period || 'daily',
      startDate,
      totalJobs,
      completedJobs,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/income', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.serviceDate = {};
      if (from) (where.serviceDate as Record<string, unknown>).gte = new Date(String(from));
      if (to) (where.serviceDate as Record<string, unknown>).lte = new Date(String(to));
    }

    const jobs = await prisma.serviceJob.findMany({
      where,
      include: { items: true },
      orderBy: { serviceDate: 'asc' },
    });

    const totalIncome = jobs.reduce((sum, job) => sum + job.paidAmount, 0);
    const totalBilled = jobs.reduce((sum, job) => sum + job.totalAmount, 0);

    res.json({
      from: from || null,
      to: to || null,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalBilled: Math.round(totalBilled * 100) / 100,
      jobCount: jobs.length,
      jobs: jobs.map(j => ({
        id: j.id,
        jobNumber: j.jobNumber,
        serviceDate: j.serviceDate,
        totalAmount: j.totalAmount,
        paidAmount: j.paidAmount,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/labor', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const where: Record<string, unknown> = { category: 'LABOR' };
    if (from || to) {
      where.serviceJob = { serviceDate: {} };
      if (from) ((where.serviceJob as Record<string, unknown>).serviceDate as Record<string, unknown>).gte = new Date(String(from));
      if (to) ((where.serviceJob as Record<string, unknown>).serviceDate as Record<string, unknown>).lte = new Date(String(to));
    }

    const laborItems = await prisma.serviceItem.findMany({
      where,
      include: { serviceJob: { select: { jobNumber: true, serviceDate: true } } },
    });

    const totalLaborCost = laborItems.reduce((sum, item) => sum + item.totalPrice, 0);

    res.json({
      totalLaborCost: Math.round(totalLaborCost * 100) / 100,
      itemCount: laborItems.length,
      items: laborItems,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/parts-usage', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const where: Record<string, unknown> = {
      category: { in: ['FILTER', 'OIL', 'SPARE_PART', 'OTHER'] },
    };
    if (from || to) {
      where.serviceJob = { serviceDate: {} };
      if (from) ((where.serviceJob as Record<string, unknown>).serviceDate as Record<string, unknown>).gte = new Date(String(from));
      if (to) ((where.serviceJob as Record<string, unknown>).serviceDate as Record<string, unknown>).lte = new Date(String(to));
    }

    const partsItems = await prisma.serviceItem.findMany({
      where,
      include: { serviceJob: { select: { jobNumber: true, serviceDate: true } } },
    });

    const totalPartsCost = partsItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Group by category
    const byCategory: Record<string, { count: number; totalCost: number }> = {};
    for (const item of partsItems) {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { count: 0, totalCost: 0 };
      }
      byCategory[item.category].count += item.quantity;
      byCategory[item.category].totalCost += item.totalPrice;
    }

    res.json({
      totalPartsCost: Math.round(totalPartsCost * 100) / 100,
      itemCount: partsItems.length,
      byCategory,
      items: partsItems,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/customer/:id/history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = parseInt(req.params.id);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        vehicles: true,
        serviceJobs: {
          include: { items: true, vehicle: true, invoices: true },
          orderBy: { serviceDate: 'desc' },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const totalSpent = customer.serviceJobs.reduce((sum, job) => sum + job.paidAmount, 0);
    const totalJobs = customer.serviceJobs.length;

    res.json({
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalJobs,
      vehicles: customer.vehicles,
      serviceJobs: customer.serviceJobs,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
