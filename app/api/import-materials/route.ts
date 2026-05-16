import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { rows, jobId } = body

    if (!rows || !jobId) {
      return NextResponse.json({ error: 'Missing rows or jobId' }, { status: 400 })
    }

    const entries = rows.map((row: any) => ({
      job_id: jobId,
      owner_id: user.id,
      type: 'material',
      description: row.description,
      quantity: row.quantity || 1,
      unit_price: row.unitPriceExGst || row.unitPriceIncGst,
      amount: row.totalExGst || row.totalIncGst,
      gst_status: 'inclusive',
      tax_category: 'cogs_material',
      entry_date: row.date || new Date().toISOString().split('T')[0],
    }))

    const { error } = await supabase.from('job_entries').insert(entries)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, count: entries.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}