import type { FC, ReactNode } from 'react'

import '@/features/auth/auth.css'
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton'
import { AuthLink } from '@/features/auth/components/AuthLink'

interface AuthLayoutProps {
  readonly title: string
  readonly subtitle: string
  readonly logoAlt: string
  readonly children: ReactNode
  readonly submitLabel: string
  readonly submittingLabel: string
  readonly onSubmit: () => Promise<void>
  readonly footerPrefix: string
  readonly footerActionLabel: string
  readonly footerActionPath: string
  readonly isSubmitting?: boolean
  readonly submitDisabled?: boolean
  readonly formError?: string | null
}

export const AuthLayout: FC<AuthLayoutProps> = ({
  title,
  subtitle,
  logoAlt,
  children,
  submitLabel,
  submittingLabel,
  onSubmit,
  footerPrefix,
  footerActionLabel,
  footerActionPath,
  isSubmitting = false,
  submitDisabled = false,
  formError = null,
}) => {
  return (
    <main className="auth-screen">
      <div className="auth-shell-background" aria-hidden="true" />

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <img className="auth-logo" src="/logo.webp" alt={logoAlt} />
        </div>

        <header className="auth-header">
          <h1 id="auth-title" className="auth-title">
            {title}
          </h1>
          <p className="auth-subtitle">{subtitle}</p>
        </header>

        <div className="auth-content">
          <form
            className="auth-form"
            noValidate
            onInvalid={(event) => {
              event.preventDefault()
            }}
            onSubmit={(event) => {
              event.preventDefault()
              void onSubmit()
            }}
          >
            {children}
            {formError ? (
              <p className="auth-error-message auth-error-message--form" role="alert">
                {formError}
              </p>
            ) : null}
            <AuthSubmitButton
              label={submitLabel}
              loadingLabel={submittingLabel}
              isLoading={isSubmitting}
              disabled={submitDisabled}
              type="submit"
            />
          </form>
        </div>

        <p className="auth-footer">
          <span>{footerPrefix}</span>
          <AuthLink variant="footer" label={footerActionLabel} to={footerActionPath} />
        </p>
      </section>
    </main>
  )
}
