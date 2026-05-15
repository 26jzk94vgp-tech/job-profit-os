'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Pricing() {
  const { lang } = useLanguage()
  const [loading, setLoading] = useState('')

  async function handleSubscribe(priceId: string, plan: string) {
    setLoading(plan)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId })
    })
    const json = await res.json()
    if (json.url) { window.location.href = json.url }
    else { alert('Error: ' + json.error) }
    setLoading('')
  }

  const plans = [
    {
      name: lang === 'zh' ? '免费版' : 'Free',
      price: '$0',
      period: lang === 'zh' ? '/月' : '/mo',
      description: lang === 'zh' ? '适合刚开始的 tradie' : 'Perfect for getting started',
      features: lang === 'zh'
        ? ['最多3个工程', '基础利润追踪', '发票生成', '报价单']
        : ['Up to 3 jobs', 'Basic profit tracking', 'Invoice generation', 'Quotes'],
      priceId: null,
      cta: lang === 'zh' ? '免费使用' : 'Get Started',
      highlight: false
    },
    {
      name: lang === 'zh' ? '专业版' : 'Pro',
      price: '$19',
      period: lang === 'zh' ? '/月' : '/mo',
      description: lang === 'zh' ? '适合活跃的 tradie' : 'For active tradies',
      features: lang === 'zh'
        ? ['无限工程', '收据 OCR 扫描', 'GST & ATO 税务报告', '现金流预测', '家庭办公室记录', '坏账预警', '邮件发票发送']
        : ['Unlimited jobs', 'Receipt OCR scanning', 'GST & ATO tax reports', 'Cash flow forecast', 'Home office tracking', 'Bad debt alerts', 'Email invoice sending'],
      priceId: 'price_1TXO6o3P1ANC7pny4NcwtJWk',
      cta: lang === 'zh' ? '开始专业版' : 'Start Pro',
      highlight: true
    },
    {
      name: lang === 'zh' ? '商业版' : 'Business',
      price: '$49',
      period: lang === 'zh' ? '/月' : '/mo',
      description: lang === 'zh' ? '适合建筑公司' : 'For building companies',
      features: lang === 'zh'
        ? ['专业版所有功能', '多用户账号', 'Super 供款优化', 'Year-End 税务清单', '优先客户支持']
        : ['Everything in Pro', 'Multi-user accounts', 'Super contribution optimizer', 'Year-End tax checklist', 'Priority support'],
      priceId: 'price_1TXOES3P1ANC7pnyJ5rPVfnf',
      cta: lang === 'zh' ? '开始商业版' : 'Start Business',
      highlight: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '订阅计划' : 'Pricing'}</h1>
          <div></div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">{lang === 'zh' ? '选择适合你的计划' : 'Choose Your Plan'}</h2>
          <p className="text-gray-500 mt-2">{lang === 'zh' ? '专为澳洲建筑行业设计' : 'Built for Australian tradies & builders'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-2xl border-2 p-6 ${plan.highlight ? 'border-blue-600 shadow-lg' : 'border-gray-200'}`}>
              {plan.highlight && (
                <div className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full inline-block mb-4">
                  {lang === 'zh' ? '最受欢迎' : 'Most Popular'}
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">{plan.description}</p>
              <ul className="space-y-2 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              {plan.priceId ? (
                <button
                  onClick={() => handleSubscribe(plan.priceId!, plan.name)}
                  disabled={loading === plan.name}
                  className={`w-full py-3 rounded-xl font-medium ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} disabled:opacity-50`}
                >
                  {loading === plan.name ? (lang === 'zh' ? '跳转中...' : 'Redirecting...') : plan.cta}
                </button>
              ) : (
                <Link href="/" className={`block text-center w-full py-3 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 text-gray-800`}>
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          {lang === 'zh' ? '所有计划均含14天免费试用 · 随时取消 · 澳元计价' : 'All plans include 14-day free trial · Cancel anytime · Prices in AUD'}
        </p>
      </main>
    </div>
  )
}