import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../db.js', () => ({
  default: {
    raw: vi.fn().mockResolvedValue({
      rows: [{ now: new Date('2024-01-01') }],
    }),
  },
}));

const { default: app } = await import('../app.js');

describe('GET /health', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('time');
  });
});
