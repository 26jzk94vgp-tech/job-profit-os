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
    const supabase = createClient()

    import('leaflet').then(L => {
      // Remove existing map if any
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_map?.remove()
        // clear leaflet id
        Object.keys(mapRef.current).forEach(k => { if (k.startsWith('_leaflet')) delete mapRef.current[k] })
      }

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

      let userLocated = false
      // Show user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const { latitude, longitude } = pos.coords
          map.setView([latitude, longitude], 12)
          userLocated = true
          const userIcon = L.divIcon({
            html: '<div style="width:14px;height:14px;background:#2F81F7;border:2px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(47,129,247,0.3)"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            className: ''
          })
          L.marker([latitude, longitude], { icon: userIcon }).addTo(map)
            .bindPopup('📍 You are here')
        }, () => {})
      }

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
            if (!userLocated && bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] })
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
  }, [jobs])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <div ref={mapRef} style={{width:'100%',height:'100%'}}/>
    </>
  )
}
