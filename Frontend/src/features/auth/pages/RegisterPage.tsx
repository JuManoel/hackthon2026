import { useEffect, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'

import { labels } from '@/constants/labels'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { PasswordField } from '@/features/auth/components/PasswordField'
import { TextField } from '@/features/auth/components/TextField'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { RegisterFormValues } from '@/features/auth/types/auth'
import {
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
} from '@/features/auth/utils/auth.validation'

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
  const [showTermsModal, setShowTermsModal] = useState(false)

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

    // Instead of registering directly, show the Terms and Conditions modal
    setShowTermsModal(true)
  }

  const performRegistration = async (): Promise<void> => {
    setShowTermsModal(false)

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
        id="register-password"
        name="password"
        label={labels.passwordLabel}
        placeholder={labels.passwordRulesPlaceholder}
        value={formValues.password}
        error={fieldErrors.password}
        disabled={isLoading}
        required
        minLength={8}
        maxLength={128}
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
        name="confirmPassword"
        label={labels.confirmPasswordLabel}
        placeholder={labels.passwordRulesPlaceholder}
        value={formValues.confirmPassword}
        error={fieldErrors.confirmPassword}
        disabled={isLoading}
        required
        minLength={8}
        maxLength={128}
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

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-neutral-0 border border-neutral-300 rounded-xl p-6 max-w-lg w-full shadow-lg flex flex-col max-h-[85vh]">
            <h2 className="text-title-3 font-semibold text-neutral-900 mb-4">Términos y Condiciones - Aviturismo</h2>
            <div className="flex-1 overflow-y-auto text-body text-neutral-700 space-y-4 pr-3 custom-scrollbar">
              <p>
                Bienvenido a nuestra plataforma. Al registrarte y utilizar nuestra aplicación, aceptas los siguientes términos diseñados para proteger tanto a la comunidad como conservar la biodiversidad:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong className="text-neutral-900">Uso Responsable:</strong> Esta plataforma está diseñada para la observación, aprendizaje y conservación de aves. Está estrictamente prohibido usarla para comercio ilegal, hostigamiento de especies o daño a hábitats.
                </li>
                <li>
                  <strong className="text-neutral-900">Ética del Aviturismo:</strong> Te comprometes a mantener una distancia prudente de las aves (especialmente en sus zonas de anidación) y a no usar señuelos sonoros (playbacks) de manera excesiva que alteren el comportamiento natural de la fauna.
                </li>
                <li>
                  <strong className="text-neutral-900">Privacidad de Registros:</strong> Las fotos y ubicaciones que compartas aportarán a la ciencia ciudadana. Con el fin de proteger a las especies amenazadas, la ubicación exacta de avistamientos vulnerables podría ser ocultada públicamente.
                </li>
                <li>
                  <strong className="text-neutral-900">Propiedad de las Imágenes:</strong> Conservas todos los derechos de autor de tus fotografías. Al subirlas a la app, nos otorgas una licencia para mostrarlas dentro del ecosistema de la plataforma con fines educativos.
                </li>
              </ol>
              <p>
                Al hacer clic en "Aceptar y Registrarse", confirmas tu compromiso con la conservación de la avifauna y el respeto por nuestros términos.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-300 transition-colors"
                onClick={() => setShowTermsModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-brand-500 text-neutral-0 hover:opacity-90 transition-opacity disabled:opacity-50"
                onClick={performRegistration}
                disabled={isLoading}
              >
                {isLoading ? 'Registrando...' : 'Aceptar y Registrarse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
