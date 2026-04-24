export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
    id: string;
    displayName: string;
    bio: string | null;
    phone: string | null;
    email: string;
    password: string;
    role: UserRole;

    emailVerifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
