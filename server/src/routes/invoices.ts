import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const where = status ? { status: String(status) } : {};

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        serviceJob: {
          include: { customer: true, vehicle: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        serviceJob: {
          include: {
            customer: true,
            vehicle: true,
            items: true,
            technician: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/',
  [body('serviceJobId').isInt().withMessage('Service job ID is required')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { serviceJobId, dueDate, notes } = req.body;

      const job = await prisma.serviceJob.findUnique({ where: { id: serviceJobId } });
      if (!job) {
        res.status(404).json({ error: 'Service job not found' });
        return;
      }

      const count = await prisma.invoice.count();
      const invoiceNumber = `INV-${(count + 1).toString().padStart(5, '0')}`;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          serviceJobId,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
        },
        include: {
          serviceJob: { include: { customer: true, vehicle: true, items: true } },
        },
      });

      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, notes } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(req.params.id) },
      data: { status, notes },
    });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
