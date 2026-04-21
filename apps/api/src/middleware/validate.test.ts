import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from './validate.js';

function mockRes() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  return { status, json } as unknown as Response;
}

const schema = z.object({
  email: z.email(),
  age: z.number().int().min(0),
});

describe('validate', () => {
  it('should return 400 with field details when parsing fails', () => {
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    const req = { body: { email: 'not-an-email', age: -5 } } as Request;

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.error).toBe('validation error');
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'age' }),
      ]),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when body is missing required fields', () => {
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    const req = { body: {} } as Request;

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should treat a missing body as an empty object (not crash)', () => {
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    const req = {} as Request;

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should replace req.body with the parsed data and call next() on success', () => {
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    const req = {
      body: { email: 'a@b.com', age: 30, extra: 'stripped' },
    } as Request;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toEqual({ email: 'a@b.com', age: 30 });
  });
});
