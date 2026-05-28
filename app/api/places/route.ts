import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat') || '-31.9505'
  const lng = searchParams.get('lng') || '115.8605'
  const query = searchParams.get('query') || 'restaurant'

  const amenity = query === 'cafe' ? 'cafe' : 'restaurant'

  try {
    const overpassQuery = `[out:json][timeout:10];node["amenity"="${amenity}"](around:1000,${lat},${lng});out 3;`
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: { 'Content-Type': 'text/plain' }
    })
    const data = await res.json()
    const results = (data.elements || []).map((e: any) => ({
      name: e.tags?.name || amenity,
      location: { address: e.tags?.['addr:street'] ? `${e.tags['addr:housenumber'] || ''} ${e.tags['addr:street']}`.trim() : '' }
    }))
    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json({ results: [] })
  }
}
