import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

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
