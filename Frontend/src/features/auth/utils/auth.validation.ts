import { labels } from '../../../constants/labels'

export function validateUsername(value: string): string | null {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return labels.usernameRequired
  }

  return null
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return labels.passwordRequired
  }

  return null
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) {
    return labels.confirmPasswordRequired
  }

  if (password !== confirmPassword) {
    return labels.passwordMismatch
  }

  return null
}
