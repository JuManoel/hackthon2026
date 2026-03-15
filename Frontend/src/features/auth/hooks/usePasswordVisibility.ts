import { useCallback, useState } from 'react'

interface PasswordVisibilityState {
  readonly isVisible: boolean
  readonly inputType: 'password' | 'text'
  readonly toggle: () => void
}

export const usePasswordVisibility = (): PasswordVisibilityState => {
  const [isVisible, setIsVisible] = useState(false)

  const toggle = useCallback(() => {
    setIsVisible((currentValue) => !currentValue)
  }, [])

  return {
    isVisible,
    inputType: isVisible ? 'text' : 'password',
    toggle,
  }
}
