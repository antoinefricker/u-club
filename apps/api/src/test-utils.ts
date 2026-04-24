import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret';

export function createTestToken(userId: string, email: string, role: string = 'admin'): string {
    return jwt.sign({ sub: userId, email, role }, TEST_SECRET, {
        expiresIn: '1h',
    });
}
