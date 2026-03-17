import { useEffect, useState, type FC } from 'react'
import { Circle, MapContainer, TileLayer, useMap } from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import { MAP_CONSTANTS } from '@/features/map/constants/map.constants'
import type { BirdZone } from '@/features/map/types/map.types'
import { BirdMapCenterControl } from '@/features/map/components/BirdMapCenterControl'
import { BirdMapLegend } from '@/features/map/components/BirdMapLegend'
import { BirdZonesLayer } from '@/features/map/components/BirdZonesLayer'

interface BirdMapViewProps {
  readonly zones: BirdZone[]
}

const MapSizeInvalidator: FC = () => {
  const map = useMap()

  useEffect(() => {
    const invalidate = (): void => {
      map.invalidateSize({
        pan: false,
        debounceMoveend: true,
      })
    }

    const frameId = globalThis.requestAnimationFrame(invalidate)

    const timeoutId = globalThis.setTimeout(invalidate, 180)

    const mapContainer = map.getContainer()
    const resizeObserver =
      typeof globalThis.ResizeObserver !== 'undefined'
        ? new globalThis.ResizeObserver(() => {
            invalidate()
          })
        : null

    resizeObserver?.observe(mapContainer)

    const handleResize = (): void => {
      invalidate()
    }

    const handleLoad = (): void => {
      invalidate()
    }

    globalThis.addEventListener('resize', handleResize)
    map.on('load', handleLoad)

    return () => {
      globalThis.cancelAnimationFrame(frameId)
      globalThis.clearTimeout(timeoutId)
      globalThis.removeEventListener('resize', handleResize)
      map.off('load', handleLoad)
      resizeObserver?.disconnect()
    }
  }, [map])

  return null
}

export const BirdMapView: FC<BirdMapViewProps> = ({ zones }) => {
  const [useFallbackTiles, setUseFallbackTiles] = useState(false)

  return (
    <div className="bird-map-view">
      <MapContainer
        center={[MAP_CONSTANTS.caldasCenter.lat, MAP_CONSTANTS.caldasCenter.lng]}
        zoom={MAP_CONSTANTS.defaultZoom}
        minZoom={MAP_CONSTANTS.minZoom}
        maxZoom={MAP_CONSTANTS.maxZoom}
        scrollWheelZoom
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
        zoomControl={false}
        attributionControl={false}
        className="bird-map-canvas"
        style={{ width: '100%', height: '100%' }}
      >
        <MapSizeInvalidator />
        <TileLayer
          attribution={useFallbackTiles ? MAP_CONSTANTS.osmAttribution : MAP_CONSTANTS.positronAttribution}
          url={useFallbackTiles ? MAP_CONSTANTS.osmTileUrl : MAP_CONSTANTS.positronTileUrl}
          eventHandlers={{
            tileerror: () => {
              setUseFallbackTiles(true)
            },
          }}
        />
        <Circle
          center={[MAP_CONSTANTS.caldasCenter.lat, MAP_CONSTANTS.caldasCenter.lng]}
          radius={MAP_CONSTANTS.caldasHighlightRadiusMeters}
          pathOptions={{
            color: MAP_CONSTANTS.caldasHighlightColor,
            fillColor: MAP_CONSTANTS.caldasHighlightColor,
            fillOpacity: MAP_CONSTANTS.caldasHighlightFillOpacity,
            opacity: 0.52,
            weight: 1.4,
            dashArray: '9 7',
            lineCap: 'round',
          }}
          interactive={false}
          className="caldas-highlight"
        />
        <BirdMapCenterControl />
        <BirdZonesLayer zones={zones} />
      </MapContainer>

      <BirdMapLegend />
    </div>
  )
}
