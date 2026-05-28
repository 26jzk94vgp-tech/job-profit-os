import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Try multiple RSS sources
    const sources = [
      'https://feeds.skynews.com/feeds/rss/australia.xml',
      'https://www.smh.com.au/rss/feed.xml',
    ]
    
    for (const url of sources) {
      try {
        const res = await fetch(url, { 
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 1800 }
        })
        if (!res.ok) continue
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
        
        if (items.length > 0) return NextResponse.json({ items })
      } catch {}
    }
    
    return NextResponse.json({ items: [] })
  } catch (e) {
    return NextResponse.json({ items: [] })
  }
}
