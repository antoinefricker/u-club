import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /members:
 *   post:
 *     tags: [Members]
 *     summary: Create a new member
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMemberRequest'
 *     responses:
 *       201:
 *         description: Member created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Member'
 *       400:
 *         description: Missing or invalid required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    const {
      first_name,
      last_name,
      gender,
      year,
      user_id,
      status_id,
      birth_date,
      license,
    } = req.body;

    if (!first_name || typeof first_name !== 'string') {
      res.status(400).json({ error: 'first_name is required' });
      return;
    }

    if (!last_name || typeof last_name !== 'string') {
      res.status(400).json({ error: 'last_name is required' });
      return;
    }

    if (!gender || (gender !== 'male' && gender !== 'female')) {
      res
        .status(400)
        .json({ error: "gender is required and must be 'male' or 'female'" });
      return;
    }

    if (year === undefined || typeof year !== 'number') {
      res.status(400).json({ error: 'year is required and must be a number' });
      return;
    }

    const [member] = await db('members')
      .insert({
        first_name,
        last_name,
        gender,
        year,
        user_id: user_id || null,
        status_id: status_id || null,
        birth_date: birth_date || null,
        license: license || null,
      })
      .returning([
        'id',
        'user_id',
        'status_id',
        'first_name',
        'last_name',
        'birth_date',
        'license',
        'gender',
        'year',
        'created_at',
        'updated_at',
      ]);

    res.status(201).json(member);
  },
);

export default router;
