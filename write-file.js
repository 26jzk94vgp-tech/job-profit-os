const fs = require('fs')
let c = fs.readFileSync('app/clients/page.tsx', 'utf8')

// 加 quotes state
c = c.replace(
  "  const [jobs, setJobs] = useState<any[]>([])",
  `  const [jobs, setJobs] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])`
)

// 加载报价单
c = c.replace(
  "    supabase.from('job_summary').select('*').order('created_at', { ascending: false }).then(({ data }) => setJobs(data || []))",
  `    supabase.from('job_summary').select('*').order('created_at', { ascending: false }).then(({ data }) => setJobs(data || []))
    supabase.from('quotes').select('*').order('created_at', { ascending: false }).then(({ data }) => setQuotes(data || []))`
)

// 加获取客户报价单函数
c = c.replace(
  "  function getClientJobs(clientName: string) {",
  `  function getClientQuotes(clientId: string, clientName: string) {
    return quotes.filter(q => q.client_id === clientId || q.client_name === clientName)
  }

  function getClientJobs(clientName: string) {`
)

// 加报价单统计到 getClientStats
c = c.replace(
  "    return { totalRevenue, totalProfit, unpaid, jobCount: clientJobs.length }",
  `    const clientQuotes = getClientQuotes(client?.id || '', clientName)
    return { totalRevenue, totalProfit, unpaid, jobCount: clientJobs.length, quoteCount: clientQuotes.length }`
)

fs.writeFileSync('app/clients/page.tsx', c)
console.log('done')
