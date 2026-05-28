'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'

interface Job {
  id: string
  name: string
  client_name: string
  site_address?: string
  revenue?: number
  lat?: number
  lng?: number
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
    if (mapRef.current._leaflet_id) return

    const supabase = createClient()

    import('leaflet').then(L => {
      if (mapRef.current._leaflet_id) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      const bounds: any[] = []

      jobs.forEach((job, index) => {
        if (!job.site_address) return

        const addMarker = (lat: number, lon: number) => {
          const marker = L.marker([lat, lon]).addTo(map)
          marker.bindPopup(`<b>${job.name}</b><br/>${job.client_name || ''}<br/>${job.site_address}<br/><span style="color:green">+$${Number(job.revenue||0).toLocaleString()}</span>`)
          bounds.push([lat, lon])
          if (bounds.length === jobs.filter(j => j.site_address).length) {
            if (bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] })
          }
        }

        // Use cached coords if available
        if (job.lat && job.lng) {
          addMarker(job.lat, job.lng)
          return
        }

        // Geocode with delay to avoid rate limiting
        setTimeout(() => {
          fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(job.site_address!)}&format=json&limit=1`)
            .then(r => r.json())
            .then(data => {
              if (data && data[0]) {
                const lat = parseFloat(data[0].lat)
                const lon = parseFloat(data[0].lon)
                addMarker(lat, lon)
                // Cache to DB
                supabase.from('jobs').update({ lat, lng: lon }).eq('id', job.id).then(() => {})
              }
            })
            .catch(() => {})
        }, index * 1200)
      })
    })

    return () => {
      if (mapRef.current?._leaflet_id) {
        mapRef.current._leaflet_map?.remove()
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
