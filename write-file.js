const fs = require('fs')

// 订阅 API
const subscribeContent = `import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    await supabase.from('push_subscriptions').upsert({
      owner_id: user.id,
      subscription
    }, { onConflict: 'owner_id' })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}`

fs.mkdirSync('app/api/push-subscribe', { recursive: true })
fs.writeFileSync('app/api/push-subscribe/route.ts', subscribeContent)

// 发送通知 API
const sendContent = `import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url } = await request.json()
    const supabase = await createClient()
    
    const { data: subs } = await supabase.from('push_subscriptions')
      .select('subscription')
      .eq('owner_id', userId)
    
    if (!subs || subs.length === 0) return NextResponse.json({ success: false, error: 'No subscription' })
    
    const payload = JSON.stringify({ title, body, url })
    
    for (const sub of subs) {
      await webpush.sendNotification(sub.subscription, payload)
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}`

fs.mkdirSync('app/api/push-send', { recursive: true })
fs.writeFileSync('app/api/push-send/route.ts', sendContent)

console.log('done')
