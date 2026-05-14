import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

async function generateJobNumber(): Promise<string> {
  const count = await prisma.serviceJob.count();
  const number = (count + 1).toString().padStart(5, '0');
  return `JOB-${number}`;
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

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
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
      const subtotal = existing.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const newDiscount = discount !== undefined ? discount : existing.discount;
      const newTaxRate = taxRate !== undefined ? taxRate : existing.taxRate;
      const newPaidAmount = paidAmount !== undefined ? paidAmount : existing.paidAmount;
      const taxAmount = Math.round(subtotal * (newTaxRate / 100) * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount - newDiscount) * 100) / 100;
      const balanceAmount = Math.round((totalAmount - newPaidAmount) * 100) / 100;

      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = totalAmount;
      updateData.balanceAmount = balanceAmount;
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

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
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
