import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createMemberSchema } from '../../schemas/member.js';

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
  validate(createMemberSchema),
  async (req: Request, res: Response) => {
    const {
      first_name,
      last_name,
      gender,
      year,
      status_id,
      birth_date,
      license,
    } = req.body;

    const [member] = await db('members')
      .insert({
        first_name,
        last_name,
        gender,
        year,
        status_id: status_id || null,
        birth_date: birth_date || null,
        license: license || null,
      })
      .returning([
        'id',
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
