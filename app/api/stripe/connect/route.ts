import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: prof } = await admin.from('profiles').select('stripe_account_id').eq('id', user.id).single()

    let accountId = prof?.stripe_account_id
    if (!accountId) {
      const account = await stripe.accounts.create({ type: 'standard', email: user.email })
      accountId = account.id
      await admin.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id)
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: origin + '/settings?connect=retry',
      return_url: origin + '/settings?connect=done',
      type: 'account_onboarding'
    })
    return NextResponse.json({ url: link.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
