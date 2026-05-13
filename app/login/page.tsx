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
      if (error) { setMessage(error.message) } else { setMessage('Check your email to confirm your account!') }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage(error.message) } else { window.location.href = '/' }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2 text-center">Job Profit OS</h1>
        <p className="text-gray-400 text-center mb-8">For Australian tradies & builders</p>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">{isSignUp ? 'Create Account' : 'Sign In'}</h2>

          <div>
            <label className="text-gray-400 text-sm">Email</label>
            <input
              type="email"
              className="w-full bg-gray-800 rounded-lg p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">Password</label>
            <input
              type="password"
              className="w-full bg-gray-800 rounded-lg p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && <p className="text-sm text-blue-400">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-gray-400 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </main>
  )
}