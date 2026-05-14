import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.query;

    const where = customerId ? { customerId: parseInt(String(customerId)) } : {};

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        serviceJobs: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/',
  [
    body('customerId').isInt().withMessage('Customer ID is required'),
    body('registrationNumber').notEmpty().withMessage('Registration number is required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { customerId, registrationNumber, model, brand, year, mileageOrHours, type, notes } = req.body;

      const vehicle = await prisma.vehicle.create({
        data: { customerId, registrationNumber, model, brand, year, mileageOrHours, type, notes },
      });

      res.status(201).json(vehicle);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { registrationNumber, model, brand, year, mileageOrHours, type, notes } = req.body;

    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(req.params.id) },
      data: { registrationNumber, model, brand, year, mileageOrHours, type, notes },
    });

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.vehicle.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
