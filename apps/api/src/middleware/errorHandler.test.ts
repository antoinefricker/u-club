import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler.js';

describe('errorHandler', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  function mockRes() {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    return { status, json } as unknown as Response;
  }

  it('should respond with 500 and a generic error message', () => {
    const err = new Error('database exploded');
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'internal server error' });
  });

  it('should log the error stack to stderr', () => {
    const err = new Error('boom');
    errorHandler(err, {} as Request, mockRes(), vi.fn() as NextFunction);
    expect(consoleSpy).toHaveBeenCalledWith(err.stack);
  });

  it('should not leak the underlying error message to the client', () => {
    const err = new Error('SELECT * FROM users WHERE password = ...');
    const res = mockRes();
    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body).toEqual({ error: 'internal server error' });
    expect(JSON.stringify(body)).not.toContain('SELECT');
  });

  it('should not call next()', () => {
    const next = vi.fn() as NextFunction;
    errorHandler(new Error('x'), {} as Request, mockRes(), next);
    expect(next).not.toHaveBeenCalled();
  });
});
