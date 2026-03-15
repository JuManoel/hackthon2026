import type { ButtonHTMLAttributes, FC } from 'react'
import { Link } from 'react-router-dom'

import '../auth.css'

type AuthLinkVariant = 'inline' | 'footer'

interface AuthLinkBaseProps {
  readonly label: string
  readonly variant: AuthLinkVariant
}

interface AuthLinkRouteProps extends AuthLinkBaseProps {
  readonly to: string
  readonly onClick?: never
  readonly buttonType?: never
}

interface AuthLinkButtonProps extends AuthLinkBaseProps {
  readonly to?: never
  readonly onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
  readonly buttonType?: 'button' | 'submit' | 'reset'
}

type AuthLinkProps = AuthLinkRouteProps | AuthLinkButtonProps

export const AuthLink: FC<AuthLinkProps> = ({
  label,
  variant,
  to,
  onClick,
  buttonType = 'button',
}) => {
  const className = variant === 'footer' ? 'auth-footer-link' : 'auth-inline-link'

  if (to) {
    return (
      <Link className={className} to={to}>
        {label}
      </Link>
    )
  }

  return (
    <button className={className} type={buttonType} onClick={onClick}>
      {label}
    </button>
  )
}
