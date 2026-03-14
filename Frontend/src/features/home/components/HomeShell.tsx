import type { FC, ReactNode } from 'react'
import { Camera, House, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { labels } from '../../../constants/labels'
import '../home.css'

type HomeTab = 'home' | 'settings' | 'cameras'

interface HomeShellProps {
  readonly activeTab: HomeTab
  readonly children: ReactNode
  readonly contentClassName?: string
}

interface TabConfig {
  readonly key: HomeTab
  readonly to: string
  readonly label: string
  readonly icon: FC<{ readonly className?: string }>
  readonly isPrimary?: boolean
}

const navTabs: readonly TabConfig[] = [
  {
    key: 'settings',
    to: '/settings',
    label: labels.settingsNavLabel,
    icon: Settings,
  },
  {
    key: 'home',
    to: '/home',
    label: labels.homeNavLabel,
    icon: House,
    isPrimary: true,
  },
  {
    key: 'cameras',
    to: '/cameras',
    label: labels.camerasNavLabel,
    icon: Camera,
  },
]

export const HomeShell: FC<HomeShellProps> = ({ activeTab, children, contentClassName }) => {
  const contentClasses = ['home-shell-content', contentClassName].filter(Boolean).join(' ')
  const isMapContent = contentClassName === 'home-shell-content--map'
  const shellClasses = ['home-shell', isMapContent ? 'home-shell--map' : null].filter(Boolean).join(' ')

  return (
    <main className={shellClasses}>
      <header className="home-shell-header">
        <img className="home-shell-logo" src="/logo.webp" alt={labels.logoAlt} />
      </header>

      <section className={contentClasses}>{children}</section>

      <footer className="home-shell-footer">
        <nav className="home-shell-nav" aria-label={labels.homeNavAriaLabel}>
          {navTabs.map((tab) => {
            const isCurrent = tab.key === activeTab
            const Icon = tab.icon

            return (
              <NavLink
                key={tab.key}
                to={tab.to}
                className={`home-shell-nav-item${tab.isPrimary ? ' is-primary' : ''}${isCurrent ? ' is-active' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <span className="home-shell-nav-icon">
                  <Icon className="home-shell-nav-icon-svg" />
                </span>
                <span className="home-shell-nav-label">{tab.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </footer>
    </main>
  )
}
