export function emailValidation(v: string) {
    return /^\S+@\S+\.\S+$/.test(v) ? null : 'Invalid email';
}
