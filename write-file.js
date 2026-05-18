const fs = require('fs')
let c = fs.readFileSync('app/quotes/new/page.tsx', 'utf8')

// 把客户 select 改成 input
c = c.replace(
  `  const [clientId, setClientId] = useState('')`,
  `  const [clientName, setClientName] = useState('')`
)

c = c.replace(
  `    supabase.from('clients').select('*').then(({ data }) => setClients(data || []))`,
  ``
)

c = c.replace(
  `  const [clients, setClients] = useState<any[]>([])`,
  ``
)

c = c.replace(
  `      client_id: clientId || null,`,
  `      client_name: clientName || null,`
)

c = c.replace(
  `            <div>
              <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '客户' : 'Client'}</label>
              <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">{lang === 'zh' ? '选择客户...' : 'Select client...'}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>`,
  `            <div>
              <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '客户名称' : 'Client Name'}</label>
              <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder={lang === 'zh' ? '例如：张先生' : 'e.g. John Smith'} value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>`
)

fs.writeFileSync('app/quotes/new/page.tsx', c)
console.log('done')
