import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default async function Quotes() {
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, jobs(name), clients(name)')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400">← Home</Link>
          <h1 className="text-2xl font-bold flex-1">Quotes</h1>
          <Link href="/quotes/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ New Quote</Link>
        </div>
        {quotes?.length === 0 && <p className="text-gray-400 text-center mt-20">No quotes yet.</p>}
        <div className="space-y-3">
          {quotes?.map((quote) => (
            <div key={quote.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{quote.clients?.name || 'No client'}</p>
                  <p className="text-gray-400 text-sm">{quote.jobs?.name || 'No job'}</p>
                </div>
                <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full">{quote.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}