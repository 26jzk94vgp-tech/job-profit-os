'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Landing() {
  // Hide bottom nav and mobile header on landing page
  useEffect(() => {
    document.body.classList.add('landing-page')
    return () => document.body.classList.remove('landing-page')
  }, [])

  return (
    <>
      <style>{`
        .landing-page ~ * { display: none !important; }
        body.landing-page .pb-20 { padding-bottom: 0 !important; }
      `}</style>
      <div className="min-h-screen bg-white">

        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-5xl mx-auto">
          <span className="text-xl font-bold text-gray-900">CIMO</span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900">Pricing</Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Log in</Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">Start Free</Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            Built for Australian Tradies &amp; Builders
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
            Know your profit<br />on every job.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            CIMO tracks labour, materials, and invoices so you always know what you are making — before and after tax.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-colors">
              Start 7-Day Free Trial
            </Link>
            <Link href="/pricing" className="text-gray-500 hover:text-gray-900 text-sm font-medium px-4 py-4">
              View Pricing →
            </Link>
          </div>
          <p className="text-gray-400 text-sm mt-4">No credit card required · Cancel anytime · Prices in AUD</p>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Everything you need to run a profitable trade business</h2>
            <p className="text-gray-500 text-center mb-14">From quote to invoice — CIMO handles the numbers so you can focus on the work.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: '💰', title: 'Job Profit Tracking', desc: 'See revenue, costs, and profit on every job in real time. Know which jobs make money and which do not.' },
                { icon: '🧾', title: 'Invoice & Quotes', desc: 'Create professional invoices and quotes in seconds. Send via email or share as PDF directly from your phone.' },
                { icon: '📋', title: 'BAS Reports', desc: 'Automatic quarterly GST summary ready to hand to your accountant. No more chasing receipts at tax time.' },
                { icon: '📅', title: 'Job Timeline', desc: 'Set start and end dates for every job. Visual progress bar shows what is on track and what is overdue.' },
                { icon: '👥', title: 'Client Management', desc: 'Keep all your clients in one place with job history, outstanding invoices, and contact details.' },
                { icon: '📈', title: 'Cash Flow Forecast', desc: '3-month income and expense forecast so you are never caught short on cash between jobs.' },
              ].map((f, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
                  <span className="text-3xl mb-3 block">{f.icon}</span>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI / OCR Section - Apple style */}
        <section className="py-24 bg-black text-white overflow-hidden">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-block bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full mb-6">Coming Soon</div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">Snap a receipt.<br />Done.</h2>
              <p className="text-gray-400 text-xl max-w-xl mx-auto">Point your camera at any receipt or invoice. CIMO reads it automatically and records the cost — no typing required.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-5">
                  <span className="text-2xl">📸</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Receipt Scanning</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Photograph any receipt from Bunnings, Reece, Tradelink or your subcontractors. CIMO extracts the amount, supplier, and date instantly.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-5">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-bold mb-3">AI Cost Categorisation</h3>
                <p className="text-gray-400 text-sm leading-relaxed">CIMO learns your spending patterns and automatically sorts every expense — materials, labour, fuel, or subcontract — so your BAS is always accurate.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="py-20 max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">Why tradies choose CIMO</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: 'I used to guess my profit margin. Now I know exactly what I make on every job before I even finish it.', name: 'Builder, Perth WA' },
              { quote: 'BAS time used to take me half a day. Now I just print the report and hand it to my accountant.', name: 'Plumber, Brisbane QLD' },
              { quote: 'The invoice feature alone saved me hours every week. My clients pay faster too.', name: 'Electrician, Sydney NSW' },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <p className="text-gray-400 text-xs font-medium">{t.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Simple pricing</h2>
            <p className="text-gray-500 text-center mb-14">Start free for 7 days. No credit card needed.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { name: 'Free', price: '$0', period: '/mo', features: ['Up to 3 jobs', 'Basic profit tracking', 'Invoice generation', 'Quotes'], cta: 'Get Started', highlight: false, href: '/login' },
                { name: 'Pro', price: '$19', period: '/mo', features: ['Unlimited jobs', 'BAS reports', 'GST & ATO tax reports', 'Cash flow forecast', 'Email invoice sending', 'Bad debt alerts'], cta: 'Start Pro', highlight: true, href: '/pricing' },
                { name: 'Business', price: '$49', period: '/mo', features: ['Everything in Pro', 'Multi-user accounts', 'Super contribution organizer', 'Year-End tax checklist', 'Priority support'], cta: 'Start Business', highlight: false, href: '/pricing' },
              ].map((plan, i) => (
                <div key={i} className={`rounded-2xl border-2 p-6 bg-white ${plan.highlight ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}>
                  {plan.highlight && <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">Most Popular</div>}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-green-500 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className={`block text-center w-full py-3 rounded-xl font-semibold transition-colors ${plan.highlight ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center px-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to know your numbers?</h2>
          <p className="text-gray-500 text-lg mb-10">Join Australian tradies who use CIMO to track profit, send invoices, and nail their BAS.</p>
          <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl text-lg font-semibold transition-colors inline-block">
            Start Your Free 7-Day Trial
          </Link>
          <p className="text-gray-400 text-sm mt-4">No credit card required</p>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 py-8 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-gray-400">
            <span className="font-semibold text-gray-600">CIMO</span>
            <span>Construction Inventory &amp; Management Optimizer</span>
            <div className="flex gap-4">
              <Link href="/pricing" className="hover:text-gray-600">Pricing</Link>
              <Link href="/login" className="hover:text-gray-600">Login</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
