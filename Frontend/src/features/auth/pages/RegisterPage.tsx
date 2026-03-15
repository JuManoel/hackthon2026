import { useEffect, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'

import { labels } from '../../../constants/labels'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField } from '../components/PasswordField'
import { TextField } from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import type { RegisterFormValues } from '../types/auth'
import {
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
} from '../utils/auth.validation'

const initialValues: RegisterFormValues = {
  username: '',
  password: '',
  confirmPassword: '',
}

export const RegisterPage: FC = () => {
  const navigate = useNavigate()
  const { register, login, isLoading, error, isAuthenticated, clearError } = useAuth()
  const [formValues, setFormValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Partial<RegisterFormValues>>({})

  useEffect(() => {
    document.title = labels.registerPageTitle
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (): Promise<void> => {
    const usernameError = validateUsername(formValues.username)
    const passwordError = validatePassword(formValues.password)
    const confirmPasswordError = validatePasswordConfirmation(
      formValues.password,
      formValues.confirmPassword,
    )

    setFieldErrors({
      username: usernameError ?? undefined,
      password: passwordError ?? undefined,
      confirmPassword: confirmPasswordError ?? undefined,
    })

    if (usernameError || passwordError || confirmPasswordError) {
      return
    }

    const didRegister = await register({
      username: formValues.username.trim(),
      password: formValues.password,
    })

    if (!didRegister) {
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
      title={labels.registerHeading}
      subtitle={labels.registerSubtitle}
      logoAlt={labels.logoAlt}
      submitLabel={labels.registerSubmit}
      submittingLabel={labels.registerSubmitting}
      footerPrefix={labels.registerFooterPrefix}
      footerActionLabel={labels.registerFooterAction}
      footerActionPath="/login"
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      submitDisabled={isLoading}
      formError={error}
    >
      <TextField
        id="register-username"
        label={labels.usernameLabel}
        placeholder={labels.usernamePlaceholder}
        value={formValues.username}
        error={fieldErrors.username}
        disabled={isLoading}
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
        id="register-password"
        label={labels.passwordLabel}
        placeholder={labels.passwordRulesPlaceholder}
        value={formValues.password}
        error={fieldErrors.password}
        disabled={isLoading}
        autoComplete="new-password"
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

      <PasswordField
        id="register-confirm-password"
        label={labels.confirmPasswordLabel}
        placeholder={labels.passwordRulesPlaceholder}
        value={formValues.confirmPassword}
        error={fieldErrors.confirmPassword}
        disabled={isLoading}
        autoComplete="new-password"
        toggleLabel={labels.passwordToggle}
        onChange={(event) => {
          if (error) {
            clearError()
          }

          setFormValues((currentValues) => ({
            ...currentValues,
            confirmPassword: event.target.value,
          }))

          if (fieldErrors.confirmPassword) {
            setFieldErrors((currentErrors) => ({
              ...currentErrors,
              confirmPassword: undefined,
            }))
          }
        }}
      />
    </AuthLayout>
  )
}
