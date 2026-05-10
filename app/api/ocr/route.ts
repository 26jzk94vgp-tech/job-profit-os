import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = await request.json()

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `You are analyzing a receipt or invoice image for a construction business. 
Extract the following information and respond ONLY with a JSON object, no other text:
{
  "description": "brief description of what was purchased",
  "amount": number (total amount in dollars, numbers only),
  "type": "material" or "subcontract" or "invoice",
  "vendor": "vendor/supplier name if visible"
}
If you cannot determine a value, use null.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({ success: true, data: parsed })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({ success: false, error: 'Failed to analyze receipt' }, { status: 500 })
  }
}
