export function phoneValidation(v: string) {
  if (!v) return null;
  const digits = v.replace(/\s/g, '');
  return /^\d{9}$/.test(digits) ? null : 'Enter 9 digits without spaces';
}

export function formatPhone(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 9);
  const parts = [
    digits.slice(0, 1),
    digits.slice(1, 3),
    digits.slice(3, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);
  return parts.join(' ');
}
