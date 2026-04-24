import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireRole } from './requireRole.js';
import type { AuthenticatedRequest } from './auth.js';

function mockRes() {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    return { status, json } as unknown as Response;
}

function reqWith(user?: AuthenticatedRequest['user']): Request {
    return { user } as unknown as Request;
}

describe('requireRole', () => {
    it('should return 403 when no user is attached to the request', () => {
        const res = mockRes();
        const next = vi.fn() as NextFunction;

        requireRole('admin')(reqWith(), res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: 'insufficient permissions',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is not in the allowed list', () => {
        const res = mockRes();
        const next = vi.fn() as NextFunction;

        requireRole('admin')(reqWith({ id: 'u1', email: 'a@b.com', role: 'user' }), res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when user role matches', () => {
        const res = mockRes();
        const next = vi.fn() as NextFunction;

        requireRole('admin')(reqWith({ id: 'u1', email: 'a@b.com', role: 'admin' }), res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept any of multiple allowed roles', () => {
        const middleware = requireRole('admin', 'manager');

        const next1 = vi.fn() as NextFunction;
        middleware(reqWith({ id: 'u1', email: 'a@b.com', role: 'manager' }), mockRes(), next1);
        expect(next1).toHaveBeenCalledOnce();

        const next2 = vi.fn() as NextFunction;
        middleware(reqWith({ id: 'u2', email: 'b@b.com', role: 'admin' }), mockRes(), next2);
        expect(next2).toHaveBeenCalledOnce();
    });
});
