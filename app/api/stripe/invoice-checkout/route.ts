import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: job } = await admin.from('jobs').select('id, name, owner_id').eq('public_token', token).single()
    if (!job) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const { data: entries } = await admin.from('job_entries').select('amount, gst_status').eq('job_id', job.id).eq('type', 'invoice')
    const ex = (entries || []).filter(e => e.gst_status === 'exclusive' || !e.gst_status).reduce((s, e) => s + Number(e.amount), 0)
    const inc = (entries || []).filter(e => e.gst_status === 'inclusive').reduce((s, e) => s + Number(e.amount), 0)
    const total = ex * 1.1 + inc
    if (total <= 0.5) return NextResponse.json({ error: 'Nothing to pay' }, { status: 400 })

    const PLATFORM_FEE_PCT = 0.01
    const { data: ownerProf } = await admin.from('profiles').select('stripe_account_id').eq('id', job.owner_id).single()
    let stripeAccount: string | undefined = undefined
    if (ownerProf?.stripe_account_id) {
      try {
        const acct = await stripe.accounts.retrieve(ownerProf.stripe_account_id)
        if (acct.charges_enabled) stripeAccount = ownerProf.stripe_account_id
      } catch (e) {}
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price_data: { currency: 'aud', product_data: { name: 'Invoice - ' + job.name }, unit_amount: Math.round(total * 100) }, quantity: 1 }],
      success_url: origin + '/invoice/' + token + '?paid=1',
      cancel_url: origin + '/invoice/' + token,
      metadata: { kind: 'invoice', jobId: job.id, ownerId: job.owner_id, token },
      ...(stripeAccount ? { payment_intent_data: { application_fee_amount: Math.round(total * 100 * PLATFORM_FEE_PCT) } } : {})
    }, stripeAccount ? { stripeAccount } : undefined)
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
