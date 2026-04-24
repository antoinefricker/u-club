export function passwordValidation(v: string) {
    return v && v.length < 6 ? 'Password must be at least 6 characters' : null;
}

export function confirmPasswordValidation(v: string, values: { password: string }) {
    return values.password && v !== values.password ? 'Passwords do not match' : null;
}
