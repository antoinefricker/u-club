import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireSelfOrRole } from './requireSelfOrRole.js';
import type { AuthenticatedRequest } from './auth.js';

function mockRes() {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    return { status, json } as unknown as Response;
}

function req(user?: AuthenticatedRequest['user'], paramsId?: string): Request {
    return { user, params: { id: paramsId } } as unknown as Request;
}

describe('requireSelfOrRole', () => {
    it('should return 403 when no user is attached', () => {
        const res = mockRes();
        const next = vi.fn() as NextFunction;

        requireSelfOrRole('admin')(req(undefined, 'u1'), res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user is neither self nor in allowed roles', () => {
        const res = mockRes();
        const next = vi.fn() as NextFunction;

        requireSelfOrRole('admin')(
            req({ id: 'u1', email: 'a@b.com', role: 'user' }, 'u2'),
            res,
            next,
        );

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when user.id matches params.id (self)', () => {
        const res = mockRes();
        const next = vi.fn() as NextFunction;

        requireSelfOrRole('admin')(
            req({ id: 'u1', email: 'a@b.com', role: 'user' }, 'u1'),
            res,
            next,
        );

        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() when user has an allowed role (not self)', () => {
        const res = mockRes();
        const next = vi.fn() as NextFunction;

        requireSelfOrRole('admin')(
            req({ id: 'admin-1', email: 'admin@b.com', role: 'admin' }, 'u2'),
            res,
            next,
        );

        expect(next).toHaveBeenCalledOnce();
    });

    it('should accept any of multiple allowed roles', () => {
        const middleware = requireSelfOrRole('admin', 'manager');
        const next = vi.fn() as NextFunction;

        middleware(
            req({ id: 'm1', email: 'm@b.com', role: 'manager' }, 'u2'),
            mockRes(),
            next,
        );

        expect(next).toHaveBeenCalledOnce();
    });
});
