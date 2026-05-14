import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { calculateJobTotals } from '../utils/calculations.js';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

async function generateJobNumber(): Promise<string> {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const jobNumber = `JOB-${timestamp}-${suffix}`;

  // Verify uniqueness (retry if collision)
  const existing = await prisma.serviceJob.findUnique({ where: { jobNumber } });
  if (existing) {
    return generateJobNumber();
  }
  return jobNumber;
}

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, customerId, from, to } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = String(status);
    if (customerId) where.customerId = parseInt(String(customerId));
    if (from || to) {
      where.serviceDate = {};
      if (from) (where.serviceDate as Record<string, unknown>).gte = new Date(String(from));
      if (to) (where.serviceDate as Record<string, unknown>).lte = new Date(String(to));
    }

    const jobs = await prisma.serviceJob.findMany({
      where,
      include: { customer: true, vehicle: true, technician: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await prisma.serviceJob.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        vehicle: true,
        technician: { select: { id: true, name: true } },
        items: { include: { inventoryItem: true } },
        invoices: true,
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Service job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/',
  requireRole('ADMIN', 'STAFF'),
  [
    body('customerId').isInt().withMessage('Customer ID is required'),
    body('vehicleId').isInt().withMessage('Vehicle ID is required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { customerId, vehicleId, serviceType, technicianId, notes, discount, taxRate } = req.body;

      const jobNumber = await generateJobNumber();

      const job = await prisma.serviceJob.create({
        data: {
          jobNumber,
          customerId,
          vehicleId,
          serviceType,
          technicianId,
          notes,
          discount: discount || 0,
          taxRate: taxRate || 0,
        },
        include: { customer: true, vehicle: true },
      });

      res.status(201).json(job);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/:id', requireRole('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, serviceType, technicianId, notes, discount, taxRate, paidAmount } = req.body;

    const existing = await prisma.serviceJob.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Service job not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (technicianId !== undefined) updateData.technicianId = technicianId;
    if (notes !== undefined) updateData.notes = notes;
    if (discount !== undefined) updateData.discount = discount;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;

    // Recalculate totals if financial fields changed
    if (discount !== undefined || taxRate !== undefined || paidAmount !== undefined) {
      const newDiscount = discount !== undefined ? discount : existing.discount;
      const newTaxRate = taxRate !== undefined ? taxRate : existing.taxRate;
      const newPaidAmount = paidAmount !== undefined ? paidAmount : existing.paidAmount;

      const totals = calculateJobTotals(existing.items, newDiscount, newTaxRate, newPaidAmount);
      updateData.subtotal = totals.subtotal;
      updateData.taxAmount = totals.taxAmount;
      updateData.totalAmount = totals.totalAmount;
      updateData.balanceAmount = totals.balanceAmount;
    }

    const job = await prisma.serviceJob.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { customer: true, vehicle: true, items: true },
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.serviceJob.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
