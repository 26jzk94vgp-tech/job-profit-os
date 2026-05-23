import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json()
    if (!description) return NextResponse.json({ type: null })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `Classify this construction expense into one of: material, labor, fuel, subcontract. Reply with ONLY the single word, nothing else. Description: "${description}"`
        }]
      })
    })

    const data = await response.json()
    const raw = data.content?.[0]?.text?.trim().toLowerCase() || ''
    const valid = ['material', 'labor', 'fuel', 'subcontract']
    const type = valid.find(t => raw.includes(t)) || null

    return NextResponse.json({ type })
  } catch (err) {
    return NextResponse.json({ type: null })
  }
}
