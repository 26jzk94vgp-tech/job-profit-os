import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default async function Clients() {
  const { data: clients } = await supabase.from('clients').select('*').order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400">← Home</Link>
          <h1 className="text-2xl font-bold flex-1">Clients</h1>
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ New Client</Link>
        </div>
        {clients?.length === 0 && <p className="text-gray-400 text-center mt-20">No clients yet.</p>}
        <div className="space-y-3">
          {clients?.map((client) => (
            <div key={client.id} className="bg-gray-900 rounded-xl p-4">
              <p className="font-semibold">{client.name}</p>
              <p className="text-gray-400 text-sm">{client.phone}</p>
              <p className="text-gray-400 text-sm">{client.email}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}