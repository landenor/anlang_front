// Правила совпадают с настройками Identity на бэкенде (Program.cs): от 8 символов, хотя бы одна цифра.
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Пароль должен быть не короче 8 символов'
  if (!/\d/.test(password)) return 'Пароль должен содержать хотя бы одну цифру'
  return null
}

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'Введите корректный email'
}
