import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', requireRole('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put(
  '/:id',
  requireRole('ADMIN'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['ADMIN', 'STAFF', 'CASHIER']).withMessage('Invalid role'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const id = parseInt(req.params.id);
      const { username, password, name, email, role } = req.body;

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check username uniqueness if changed
      if (username && username !== existing.username) {
        const duplicate = await prisma.user.findUnique({ where: { username } });
        if (duplicate) {
          res.status(409).json({ error: 'Username already exists' });
          return;
        }
      }

      const updateData: any = {
        name,
        email: email || null,
        role,
      };

      if (username && username !== existing.username) {
        updateData.username = username;
      }

      // Only hash and update password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, username: true, name: true, role: true, email: true, createdAt: true },
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
