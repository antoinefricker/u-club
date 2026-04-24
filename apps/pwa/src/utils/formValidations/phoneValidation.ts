export function phoneValidation(v: string | null) {
    if (!v) {
        return null;
    }
    const digits = v.replace(/\s/g, '');
    return /^\d{10}$/.test(digits) ? null : 'Enter 10 digits';
}

export function formatPhone(v: string): string {
    const digits = v.replace(/\D/g, '').slice(0, 10);
    const parts = [
        digits.slice(0, 2),
        digits.slice(2, 4),
        digits.slice(4, 6),
        digits.slice(6, 8),
        digits.slice(8, 10),
    ].filter(Boolean);
    return parts.join(' ');
}
