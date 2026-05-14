import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { calculateItemTotal, calculateJobTotals } from '../utils/calculations.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

async function recalculateJobTotals(jobId: number): Promise<void> {
  const job = await prisma.serviceJob.findUnique({
    where: { id: jobId },
    include: { items: true },
  });

  if (!job) return;

  const totals = calculateJobTotals(job.items, job.discount, job.taxRate, job.paidAmount);

  await prisma.serviceJob.update({
    where: { id: jobId },
    data: totals,
  });
}

router.post(
  '/:jobId/items',
  requireRole('ADMIN', 'STAFF'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
    body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const jobId = parseInt(req.params.jobId);
      const { name, category, quantity, unitPrice, inventoryItemId } = req.body;

      const job = await prisma.serviceJob.findUnique({ where: { id: jobId } });
      if (!job) {
        res.status(404).json({ error: 'Service job not found' });
        return;
      }

      const totalPrice = calculateItemTotal(quantity, unitPrice);

      if (inventoryItemId) {
        // Wrap inventory check + deduction + item creation in a transaction
        const item = await prisma.$transaction(async (tx) => {
          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { id: inventoryItemId },
          });

          if (!inventoryItem) {
            throw new Error('INVENTORY_NOT_FOUND');
          }

          if (inventoryItem.quantity < quantity) {
            throw new Error('INSUFFICIENT_INVENTORY');
          }

          await tx.inventoryItem.update({
            where: { id: inventoryItemId },
            data: { quantity: inventoryItem.quantity - quantity },
          });

          return tx.serviceItem.create({
            data: {
              serviceJobId: jobId,
              name,
              category: category || 'OTHER',
              quantity,
              unitPrice,
              totalPrice,
              inventoryItemId,
            },
          });
        });

        await recalculateJobTotals(jobId);
        res.status(201).json(item);
      } else {
        const item = await prisma.serviceItem.create({
          data: {
            serviceJobId: jobId,
            name,
            category: category || 'OTHER',
            quantity,
            unitPrice,
            totalPrice,
            inventoryItemId: null,
          },
        });

        await recalculateJobTotals(jobId);
        res.status(201).json(item);
      }
    } catch (error: any) {
      if (error?.message === 'INVENTORY_NOT_FOUND') {
        res.status(404).json({ error: 'Inventory item not found' });
        return;
      }
      if (error?.message === 'INSUFFICIENT_INVENTORY') {
        res.status(400).json({ error: 'Insufficient inventory quantity' });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/:jobId/items/:itemId', requireRole('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = parseInt(req.params.jobId);
    const itemId = parseInt(req.params.itemId);
    const { name, category, quantity, unitPrice } = req.body;

    const existing = await prisma.serviceItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.serviceJobId !== jobId) {
      res.status(404).json({ error: 'Service item not found' });
      return;
    }

    const newQuantity = quantity !== undefined ? quantity : existing.quantity;
    const newUnitPrice = unitPrice !== undefined ? unitPrice : existing.unitPrice;
    const totalPrice = calculateItemTotal(newQuantity, newUnitPrice);

    // If item is linked to inventory, adjust stock for quantity delta
    if (existing.inventoryItemId && quantity !== undefined && quantity !== existing.quantity) {
      await prisma.$transaction(async (tx) => {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: existing.inventoryItemId! },
        });

        if (!inventoryItem) {
          throw new Error('INVENTORY_NOT_FOUND');
        }

        // Restore old quantity, then deduct new quantity
        const adjustedStock = inventoryItem.quantity + existing.quantity - newQuantity;

        if (adjustedStock < 0) {
          throw new Error('INSUFFICIENT_INVENTORY');
        }

        await tx.inventoryItem.update({
          where: { id: existing.inventoryItemId! },
          data: { quantity: adjustedStock },
        });

        await tx.serviceItem.update({
          where: { id: itemId },
          data: {
            name: name || existing.name,
            category: category || existing.category,
            quantity: newQuantity,
            unitPrice: newUnitPrice,
            totalPrice,
          },
        });
      });
    } else {
      await prisma.serviceItem.update({
        where: { id: itemId },
        data: {
          name: name || existing.name,
          category: category || existing.category,
          quantity: newQuantity,
          unitPrice: newUnitPrice,
          totalPrice,
        },
      });
    }

    const item = await prisma.serviceItem.findUnique({ where: { id: itemId } });
    await recalculateJobTotals(jobId);

    res.json(item);
  } catch (error: any) {
    if (error?.message === 'INVENTORY_NOT_FOUND') {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }
    if (error?.message === 'INSUFFICIENT_INVENTORY') {
      res.status(400).json({ error: 'Insufficient inventory quantity' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:jobId/items/:itemId', requireRole('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = parseInt(req.params.jobId);
    const itemId = parseInt(req.params.itemId);

    const existing = await prisma.serviceItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.serviceJobId !== jobId) {
      res.status(404).json({ error: 'Service item not found' });
      return;
    }

    // Restore inventory and delete item in a transaction for consistency
    if (existing.inventoryItemId) {
      await prisma.$transaction(async (tx) => {
        await tx.inventoryItem.update({
          where: { id: existing.inventoryItemId! },
          data: { quantity: { increment: existing.quantity } },
        });
        await tx.serviceItem.delete({ where: { id: itemId } });
      });
    } else {
      await prisma.serviceItem.delete({ where: { id: itemId } });
    }

    await recalculateJobTotals(jobId);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
