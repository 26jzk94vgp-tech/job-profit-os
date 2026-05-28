import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat') || '-31.9505'
  const lng = searchParams.get('lng') || '115.8605'
  const query = searchParams.get('query') || 'restaurant'

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&lat=${lat}&lon=${lng}&format=json&limit=3&bounded=1&viewbox=${Number(lng)-0.01},${Number(lat)+0.01},${Number(lng)+0.01},${Number(lat)-0.01}`,
      { headers: { 'User-Agent': 'CIMO-App/1.0' } }
    )
    const data = await res.json()
    const results = data.map((e: any) => ({
      name: e.display_name.split(',')[0],
      location: { address: e.display_name.split(',').slice(0,3).join(',') }
    }))
    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json({ results: [] })
  }
}
