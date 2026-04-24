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
        const { firstName, lastName, gender, statusId, birthdate } = req.body;

        const [member] = await db('members')
            .insert({
                firstName,
                lastName,
                gender,
                statusId: statusId || null,
                birthdate: birthdate || null,
            })
            .returning([
                'id',
                'statusId',
                'firstName',
                'lastName',
                'birthdate',
                'gender',
                'createdAt',
                'updatedAt',
            ]);

        res.status(201).json(member);
    },
);

export default router;
