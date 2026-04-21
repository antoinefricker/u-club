import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, type AuthenticatedRequest } from './auth.js';

const SECRET = 'test-secret';

function mockRes() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  return { status, json } as unknown as Response;
}

function reqWith(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
}

describe('requireAuth', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should return 401 when the Authorization header is missing', () => {
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(reqWith(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when the Authorization header is not Bearer', () => {
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(reqWith('Basic abc'), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 500 when JWT_SECRET is not configured', () => {
    delete process.env.JWT_SECRET;
    const token = jwt.sign(
      { sub: 'u1', email: 'a@b.com', role: 'user' },
      SECRET,
    );
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(reqWith(`Bearer ${token}`), res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'server configuration error',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when the token is invalid', () => {
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(reqWith('Bearer not.a.jwt'), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'invalid or expired token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when the token has expired', () => {
    const token = jwt.sign(
      { sub: 'u1', email: 'a@b.com', role: 'user' },
      SECRET,
      { expiresIn: '-1s' },
    );
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(reqWith(`Bearer ${token}`), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'invalid or expired token',
    });
  });

  it('should return 401 when the token was signed with a different secret', () => {
    const token = jwt.sign(
      { sub: 'u1', email: 'a@b.com', role: 'user' },
      'wrong-secret',
    );
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(reqWith(`Bearer ${token}`), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should attach user to req and call next() for a valid token', () => {
    const token = jwt.sign(
      { sub: 'u1', email: 'a@b.com', role: 'admin' },
      SECRET,
    );
    const req = reqWith(`Bearer ${token}`);
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect((req as AuthenticatedRequest).user).toEqual({
      id: 'u1',
      email: 'a@b.com',
      role: 'admin',
    });
  });
});
