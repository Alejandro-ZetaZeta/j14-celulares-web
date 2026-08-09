export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%*])[A-Za-z\d!@#$%*]{10,}$/;

export const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "10 caracteres mínimo", test: (value: string) => value.length >= 10 },
  { key: "upper", label: "Una letra mayúscula", test: (value: string) => /[A-Z]/.test(value) },
  { key: "lower", label: "Una letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { key: "number", label: "Un número", test: (value: string) => /\d/.test(value) },
  { key: "special", label: "Un carácter especial: ! @ # $ % *", test: (value: string) => /[!@#$%*]/.test(value) },
] as const;

export function isStrongPassword(value: string): boolean {
  return STRONG_PASSWORD_REGEX.test(value);
}
