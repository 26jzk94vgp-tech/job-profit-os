import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { base64, mediaType } = await req.json()

    const isImage = mediaType.startsWith('image/')
    const contentBlock = isImage
      ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }
      : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: `Extract all quote line items from this document. Return ONLY a JSON array, no markdown, no explanation. Each item must have: description, area (Bath/Ensuite/PWC/Kitchen/Laundry/Alfresco/Living/General or empty), item_type (Tile/Floor/Wall/Floor&Wall/Waterproofing/General Items/Labour or empty), item_group (Floors & Walls/Waterproofing/General Items/Labour or empty), quantity (default "1"), unit, unit_price (sell price or empty), cost_price (always empty). Example: [{"description":"600x300 TILES BATH","area":"Bath","item_type":"Floor&Wall","item_group":"Floors & Walls","quantity":"1","unit":"m2","unit_price":"3500","cost_price":""}]`
            }
          ]
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.find((c: any) => c.type === 'text')?.text || '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const items = JSON.parse(clean)

    return NextResponse.json({ items })
  } catch (err) {
    console.error('AI scan error:', err)
    return NextResponse.json({ error: 'Recognition failed' }, { status: 500 })
  }
}
