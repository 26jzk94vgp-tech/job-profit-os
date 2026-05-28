import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat') || '-31.9505'
  const lng = searchParams.get('lng') || '115.8605'
  const query = searchParams.get('query') || 'restaurant'

  try {
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?query=${query}&ll=${lat},${lng}&radius=1000&limit=3&fields=name,location,rating,price,categories`,
      {
        headers: {
          'Authorization': process.env.FOURSQUARE_API_KEY!,
          'Accept': 'application/json'
        }
      }
    )
    const data = await res.json()
    return NextResponse.json({ results: data.results || [] })
  } catch (e) {
    return NextResponse.json({ results: [] })
  }
}
