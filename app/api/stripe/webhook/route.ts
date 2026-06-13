import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.metadata?.kind === 'invoice') {
      const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      await admin.from('invoice_payments').insert({ job_id: session.metadata.jobId, owner_id: session.metadata.ownerId, amount: (session.amount_total || 0) / 100, stripe_session_id: session.id })
      return NextResponse.json({ received: true })
    }
    const userId = session.metadata?.userId
    if (userId) {
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        status: 'active',
        plan: 'pro'
      })
      await supabase.from('profiles').update({ plan_type: 'pro' }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('stripe_subscription_id', sub.id)
    const { data: subData } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', sub.id).single()
    if (subData?.user_id) {
      await supabase.from('profiles').update({ plan_type: 'trial' }).eq('id', subData.user_id)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    await supabase.from('subscriptions').update({ status: sub.status }).eq('stripe_subscription_id', sub.id)
    const { data: subData } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', sub.id).single()
    if (subData?.user_id) {
      const planType = (sub.status === 'active' || sub.status === 'trialing') ? 'pro' : 'trial'
      await supabase.from('profiles').update({ plan_type: planType }).eq('id', subData.user_id)
    }
  }

  return NextResponse.json({ received: true })
}
