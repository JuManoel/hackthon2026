import { useEffect, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'

import { labels } from '@/constants/labels'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { PasswordField } from '@/features/auth/components/PasswordField'
import { TextField } from '@/features/auth/components/TextField'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { LoginFormValues } from '@/features/auth/types/auth'
import { validatePassword, validateUsername } from '@/features/auth/utils/auth.validation'

const initialValues: LoginFormValues = {
  username: '',
  password: '',
}

export const LoginPage: FC = () => {
  const navigate = useNavigate()
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth()
  const [formValues, setFormValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Partial<LoginFormValues>>({})

  useEffect(() => {
    document.title = labels.loginPageTitle
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (): Promise<void> => {
    const usernameError = validateUsername(formValues.username)
    const passwordError = validatePassword(formValues.password)

    setFieldErrors({
      username: usernameError ?? undefined,
      password: passwordError ?? undefined,
    })

    if (usernameError || passwordError) {
      return
    }

    const didLogin = await login({
      username: formValues.username.trim(),
      password: formValues.password,
    })

    if (didLogin) {
      navigate('/home', { replace: true })
    }
  }

  return (
    <AuthLayout
      title={labels.loginHeading}
      subtitle={labels.loginSubtitle}
      logoAlt={labels.logoAlt}
      submitLabel={labels.loginSubmit}
      submittingLabel={labels.loginSubmitting}
      footerPrefix={labels.loginFooterPrefix}
      footerActionLabel={labels.loginFooterAction}
      footerActionPath="/register"
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      submitDisabled={isLoading}
      formError={error}
    >
      <TextField
        id="login-username"
        name="username"
        label={labels.usernameLabel}
        placeholder={labels.usernamePlaceholder}
        value={formValues.username}
        error={fieldErrors.username}
        disabled={isLoading}
        required
        minLength={3}
        maxLength={64}
        autoComplete="username"
        onChange={(event) => {
          if (error) {
            clearError()
          }

          setFormValues((currentValues) => ({
            ...currentValues,
            username: event.target.value,
          }))

          if (fieldErrors.username) {
            setFieldErrors((currentErrors) => ({
              ...currentErrors,
              username: undefined,
            }))
          }
        }}
      />

      <PasswordField
        id="login-password"
        name="password"
        label={labels.passwordLabel}
        placeholder={labels.passwordPlaceholder}
        value={formValues.password}
        error={fieldErrors.password}
        disabled={isLoading}
        required
        minLength={8}
        maxLength={128}
        autoComplete="current-password"
        toggleLabel={labels.passwordToggle}
        onChange={(event) => {
          if (error) {
            clearError()
          }

          setFormValues((currentValues) => ({
            ...currentValues,
            password: event.target.value,
          }))

          if (fieldErrors.password) {
            setFieldErrors((currentErrors) => ({
              ...currentErrors,
              password: undefined,
            }))
          }
        }}
      />
    </AuthLayout>
  )
}
