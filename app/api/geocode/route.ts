import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  if (q.length < 4) return NextResponse.json([])
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=au`
    const r = await fetch(url, { headers: { 'User-Agent': 'CIMO/1.0 (job profit app)' } })
    if (!r.ok) return NextResponse.json([])
    const data = await r.json()
    return NextResponse.json((data as { display_name: string }[]).map(d => d.display_name))
  } catch {
    return NextResponse.json([])
  }
}
