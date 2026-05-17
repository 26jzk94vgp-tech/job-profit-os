import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = await request.json()

    const response = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2048,
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
              text: `You are an expert receipt and invoice analyzer for Australian construction businesses.
Carefully examine this receipt/invoice image and extract ALL visible information.

Respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "description": "specific description of main item or service purchased",
  "amount": <total amount as number, including GST if shown>,
  "gst": <GST amount as number, or null if not shown>,
  "amount_ex_gst": <amount excluding GST as number, or null>,
  "type": "material" or "subcontract" or "invoice" or "fuel",
  "vendor": "supplier/store name",
  "invoice_number": "invoice or receipt number if visible, or null",
  "date": "date in YYYY-MM-DD format if visible, or null",
  "quantity": <quantity as number if single item, or null>,
  "unit_price": <unit price as number if visible, or null>,
  "gst_status": "inclusive" if price includes GST, "exclusive" if GST added on top, "free" if no GST,
  "items": [
    {
      "description": "item description",
      "quantity": <number or null>,
      "unit_price": <number or null>,
      "total": <number or null>
    }
  ]
}

Important rules:
- For Australian receipts, GST is 10%. If total shown with GST, gst = total / 11
- Bunnings, Tradelink, Reece, Total Tools etc are "material" type
- Fuel stations (BP, Shell, Caltex, 7-Eleven) are "fuel" type  
- If multiple items, list them all in "items" array
- amount should be the TOTAL amount shown on receipt
- Remove $ signs from all numbers
- If unclear, use null not 0`,
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