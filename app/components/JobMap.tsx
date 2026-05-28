'use client'
import { useEffect, useRef } from 'react'

interface Job {
  id: string
  name: string
  client_name: string
  site_address?: string
  revenue?: number
}

interface Props {
  jobs: Job[]
  isDark: boolean
}

export default function JobMap({ jobs, isDark }: Props) {
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mapRef.current) return

    let map: any = null

    import('leaflet').then(L => {
      // Check if container already has a map
      if (mapRef.current._leaflet_id) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      jobs.forEach(job => {
        if (!job.site_address) return
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(job.site_address)}&format=json&limit=1`)
          .then(r => r.json())
          .then(data => {
            if (data && data[0]) {
              const lat = parseFloat(data[0].lat)
              const lon = parseFloat(data[0].lon)
              L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${job.name}</b><br/>${job.site_address}<br/><span style="color:green">+$${Number(job.revenue||0).toLocaleString()}</span>`)
            }
          })
          .catch(() => {})
      })
    })

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <div ref={mapRef} style={{width:'100%',height:'100%'}}/>
    </>
  )
}
