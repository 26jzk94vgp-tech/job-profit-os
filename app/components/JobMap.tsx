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
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (mapInstanceRef.current) return

    import('leaflet').then(L => {
      // Fix marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center: [-31.9505, 115.8605],
        zoom: 12,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      mapInstanceRef.current = map

      // Geocode and add markers for jobs with addresses
      jobs.forEach(job => {
        if (!job.site_address) return
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(job.site_address + ', Perth, WA')}&format=json&limit=1`)
          .then(r => r.json())
          .then(data => {
            if (data && data[0]) {
              const lat = parseFloat(data[0].lat)
              const lon = parseFloat(data[0].lon)
              const marker = L.marker([lat, lon]).addTo(map)
              marker.bindPopup(`
                <b>${job.name}</b><br/>
                ${job.client_name || ''}<br/>
                ${job.site_address}<br/>
                <span style="color:green">+$${Number(job.revenue||0).toLocaleString()}</span>
              `)
            }
          })
          .catch(() => {})
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <div ref={mapRef} style={{width:'100%',height:'100%',borderRadius:'4px'}}/>
    </>
  )
}
