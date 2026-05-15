import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'

export default async function Quotes() {
  const supabase = await createClient()
  const { data: quotesList } = await supabase.from('quotes').select('*, jobs(name), clients(name)').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← 首页 / Home</Link>
            <h1 className="font-semibold text-gray-900">报价单 / Quotes</h1>
          </div>
          <Link href="/quotes/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ 新建报价单 / New Quote</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200">
          {!quotesList?.length && <div className="px-6 py-16 text-center text-gray-400">还没有报价单 / No quotes yet.</div>}
          <div className="divide-y divide-gray-100">
            {quotesList?.map((quote) => (
              <Link href={"/quotes/" + quote.id} key={quote.id}>
                <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">{quote.clients?.name || '无客户 / No client'}</p>
                    <p className="text-gray-500 text-sm">{quote.jobs?.name || '无工程 / No job'} · {quote.quote_number || 'Q-001'}</p>
                  </div>
                  <span className={
                    quote.status === 'accepted' ? 'text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full' :
                    quote.status === 'sent' ? 'text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full' :
                    quote.status === 'declined' ? 'text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full' :
                    'text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'
                  }>{quote.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}