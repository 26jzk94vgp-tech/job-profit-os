'use client'

import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  async function handleSubmit() {
    setLoading(true)
    setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        // 新用户 → onboarding 填公司信息
        window.location.href = '/onboarding'
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        // 老用户 → 检查是否填过公司信息
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name')
          .eq('id', data.user.id)
          .single()
        if (!profile?.company_name) {
          window.location.href = '/onboarding'
        } else {
          window.location.href = '/'
        }
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2 text-center tracking-tight">CIMO</h1>
        <p className="text-[#8E8E93] text-center mb-2 text-sm">For Australian tradies & builders</p>
        {isSignUp && (
          <div className="mb-6 text-center">
            <div className="inline-block bg-[#30D158]/20 border border-[#30D158]/40 rounded-full px-3 py-1">
              <p className="text-[#30D158] text-xs font-semibold">🎉 60-day free trial — all features unlocked</p>
            </div>
          </div>
        )}
        {!isSignUp && <div className="mb-6" />}

        <div className="bg-[#1C1C1E] rounded-2xl p-6 space-y-4 border border-[#3A3A3C]">
          <h2 className="text-xl font-semibold text-white">{isSignUp ? 'Create Account' : 'Sign In'}</h2>

          <div>
            <label className="text-[#8E8E93] text-sm">Email</label>
            <input
              type="email"
              className="w-full bg-[#2C2C2E] border border-[#3A3A3C] rounded-xl p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-[#0A84FF]/50 transition"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className="text-[#8E8E93] text-sm">Password</label>
            <input
              type="password"
              className="w-full bg-[#2C2C2E] border border-[#3A3A3C] rounded-xl p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-[#0A84FF]/50 transition"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {message && <p className="text-sm text-[#FF453A]">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-[#0A84FF] hover:bg-blue-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
            className="w-full text-[#0A84FF] text-sm py-2"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </main>
  )
}
