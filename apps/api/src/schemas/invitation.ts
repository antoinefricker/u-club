import { z } from 'zod';

export const createInvitationSchema = z.object({
    memberId: z.string({ error: 'memberId is required' }),
    email: z.string({ error: 'email is required' }),
    type: z.enum(['self', 'relative'], {
        error: "type must be 'self' or 'relative'",
    }),
    description: z.string().nullable().optional(),
});

export const acceptInvitationSchema = z.object({
    description: z.string().nullable().optional(),
    type: z
        .enum(['self', 'relative'], {
            error: "type must be 'self' or 'relative'",
        })
        .optional(),
});

export const registerAndAcceptInvitationSchema = z.object({
    displayName: z.string({ error: 'displayName is required' }).min(1, { error: 'displayName is required' }),
    password: z.string({ error: 'password is required' }).min(8, { error: 'password must be at least 8 characters' }),
});
