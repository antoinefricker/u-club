import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body ?? {});
        if (!result.success) {
            const details = result.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            res.status(400).json({ error: 'validation error', details });
            return;
        }
        req.body = result.data;
        next();
    };
}
