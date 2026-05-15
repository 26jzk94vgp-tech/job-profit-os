import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

// stripe initialized per request

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { priceId } = await request.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://job-profit-os-git-main-26jzk94vgp-techs-projects.vercel.app/settings?subscription=success',
      cancel_url: 'https://job-profit-os-git-main-26jzk94vgp-techs-projects.vercel.app/pricing',
      metadata: { userId: user.id }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}