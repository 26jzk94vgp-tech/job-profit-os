import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'

export default async function Clients() {
  const supabase = await createClient()
  const { data: clientsList } = await supabase.from('clients').select('*').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Home</Link>
            <h1 className="font-semibold text-gray-900">Clients</h1>
          </div>
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ New Client</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200">
          {!clientsList?.length && <div className="px-6 py-16 text-center text-gray-400">No clients yet.</div>}
          <div className="divide-y divide-gray-100">
            {clientsList?.map((client) => (
              <div key={client.id} className="px-6 py-4">
                <p className="font-medium text-gray-900">{client.name}</p>
                <p className="text-gray-500 text-sm">{client.phone} {client.email}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}