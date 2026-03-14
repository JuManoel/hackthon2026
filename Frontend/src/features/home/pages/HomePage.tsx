import { useEffect, type FC } from 'react'

import { labels } from '../../../constants/labels'
import { HomeBirdMap } from '../../map/components/HomeBirdMap'
import { HomeShell } from '../components/HomeShell'

interface HomePageProps {
  readonly __noProps?: never
}

export const HomePage: FC<HomePageProps> = () => {
  useEffect(() => {
    document.title = labels.homePageTitle
  }, [])

  return (
    <HomeShell activeTab="home" contentClassName="home-shell-content--map">
      <div className="home-map-wrap">
        <HomeBirdMap />
      </div>
    </HomeShell>
  )
}
