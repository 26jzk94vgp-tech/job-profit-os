'use client'
import { useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'

export default function SignOut() {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.signOut().finally(() => { window.location.href = '/login' })
  }, [])
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'#8E8E93',fontSize:'14px'}}>Signing out...</div>
}
