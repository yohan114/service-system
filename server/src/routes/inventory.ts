import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/low-stock', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await prisma.$queryRaw`
      SELECT * FROM InventoryItem WHERE quantity <= reorderLevel
    ` as unknown[];

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, category, lowStock } = req.query;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: String(search) };
    }
    if (category) {
      where.category = String(category);
    }

    let items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (lowStock === 'true') {
      items = items.filter(item => item.quantity <= item.reorderLevel);
    }

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!item) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be non-negative'),
    body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { name, category, quantity, unitPrice, reorderLevel, unit } = req.body;

      const item = await prisma.inventoryItem.create({
        data: { name, category, quantity, unitPrice, reorderLevel: reorderLevel || 0, unit },
      });

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category, quantity, unitPrice, reorderLevel, unit } = req.body;

    const item = await prisma.inventoryItem.update({
      where: { id: parseInt(req.params.id) },
      data: { name, category, quantity, unitPrice, reorderLevel, unit },
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.inventoryItem.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
