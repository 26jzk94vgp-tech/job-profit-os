import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://www.abc.net.au/news/feed/51120/rss.xml', {
      next: { revalidate: 1800 }
    })
    const text = await res.text()
    const items: any[] = []
    
    const itemMatches = text.split('<item>')
    for (let i = 1; i < itemMatches.length && items.length < 5; i++) {
      const item = itemMatches[i]
      const titleMatch = item.match(/CDATA\[(.*?)\]\]/) || item.match(/<title>(.*?)<\/title>/)
      const linkMatch = item.match(/<link>(.*?)<\/link>/)
      const descMatch = item.match(/description>.*?CDATA\[(.*?)\]\]/) 
      
      const title = titleMatch?.[1]?.trim() || ''
      const link = linkMatch?.[1]?.trim() || ''
      const desc = descMatch?.[1]?.replace(/<[^>]*>/g, '').slice(0, 120) || ''
      
      if (title) items.push({ title, link, desc })
    }
    
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ items: [] })
  }
}
