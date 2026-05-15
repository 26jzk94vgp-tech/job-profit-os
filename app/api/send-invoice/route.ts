import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { jobId, toEmail, toName, companyName, companyEmail, invoiceNumber, dueDate } = await request.json()
    const supabase = await createClient()
    const { data: job } = await supabase.from('job_summary').select('*').eq('id', jobId).single()
    const { data: entries } = await supabase.from('job_entries').select('*').eq('job_id', jobId).eq('type', 'invoice')
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    const revenue = Number(job.revenue)
    const itemsHtml = entries && entries.length > 0
      ? entries.map((e: any) => '<tr><td style="padding:8px 0;border-bottom:1px solid #eee">' + (e.description || 'Service') + '</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">$' + Number(e.amount).toLocaleString() + '</td></tr>').join('')
      : '<tr><td style="padding:8px 0">' + job.name + ' - Professional Services</td><td style="padding:8px 0;text-align:right">$' + revenue.toLocaleString() + '</td></tr>'
    const html = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="display:flex;justify-content:space-between;margin-bottom:32px"><div><h2 style="margin:0">' + companyName + '</h2>' + (companyEmail ? '<p style="color:#666">' + companyEmail + '</p>' : '') + '</div><div style="text-align:right"><h1 style="margin:0;color:#2563eb">INVOICE</h1><p style="color:#666">' + invoiceNumber + '</p>' + (dueDate ? '<p style="color:#666">Due: ' + dueDate + '</p>' : '') + '</div></div><div style="margin-bottom:24px"><p style="color:#999;font-size:12px">BILL TO</p><p style="font-weight:600">' + (toName || job.client_name) + '</p></div><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:2px solid #eee"><th style="text-align:left;padding:8px 0;color:#666">Description</th><th style="text-align:right;padding:8px 0;color:#666">Amount</th></tr></thead><tbody>' + itemsHtml + '</tbody><tfoot><tr><td style="padding:16px 0;font-weight:700">Total</td><td style="padding:16px 0;font-weight:700;text-align:right;color:#2563eb">$' + revenue.toLocaleString() + '</td></tr></tfoot></table><p style="color:#999;margin-top:32px;font-size:14px">Thank you for your business!</p></div>'
    const { error } = await resend.emails.send({
      from: 'Invoice <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Invoice ' + invoiceNumber + ' from ' + companyName,
      html,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}