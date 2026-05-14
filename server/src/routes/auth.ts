import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, AuthRequest, JWT_SECRET } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { username, password } = req.body;

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role, name: user.name },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/register',
  authenticate,
  requireRole('ADMIN'),
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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
      const { username, password, name, email, role } = req.body;

      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { username, password: hashedPassword, name, email, role },
        select: { id: true, username: true, name: true, role: true, email: true, createdAt: true },
      });

      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true, name: true, role: true, email: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
